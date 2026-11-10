import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { OWNER_EMAIL, quoteSchema } from "./schema.ts";

// Public lead form: no account required; data access remains server-only.
Deno.serve(async req => {
  const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Méthode non autorisée" }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 12000) return respond({ error: "Demande trop longue." }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return respond({ error: "Demande invalide." }, 400); }
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) return respond({ error: "Vérifiez les informations de votre demande." }, 400);
    const { website: _website, ...quote } = parsed.data;
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Missing Supabase environment variable(s)");
    const db = createClient(url, key);
    const { count, error: countError } = await db.from("catering_quote_requests")
      .select("id", { count: "exact", head: true }).eq("email", quote.email)
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());
    if (countError) throw countError;
    if ((count ?? 0) >= 5) return respond({ error: "Plusieurs demandes ont déjà été reçues. Réessayez plus tard." }, 429);
    const { data: saved, error } = await db.from("catering_quote_requests").insert(quote).select("id").single();
    if (error || !saved) throw error || new Error("Save failed");
    let notificationSent = false;
    const emailKey = Deno.env.get("RESEND_API_KEY");
    try {
      if (!emailKey) throw new Error("Email not configured");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${emailKey}`, "Content-Type": "application/json", "Idempotency-Key": `catering-${saved.id}` },
        body: JSON.stringify({
          from: "SUSHIEATS <confirmation@email.contact.sushieats.fr>", to: [OWNER_EMAIL], reply_to: quote.email,
          subject: `[Traiteur ${quote.audience === "business" ? "entreprise" : "particulier"}] Nouvelle demande de devis`,
          text: `Nouvelle demande traiteur SUSHIEATS\nRéférence : ${saved.id}\n\nNom : ${quote.name}\nEntreprise : ${quote.company || "—"}\nE-mail : ${quote.email}\nTéléphone : ${quote.phone}\nÉvénement : ${quote.event_type}\nDate : ${quote.event_date.split("-").reverse().join("/")}\nLieu : ${quote.location}\nPersonnes : ${quote.guests}\n\nBesoins particuliers :\n${quote.needs || "Non précisés"}`,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.id) throw new Error(`Provider refused (${response.status})`);
      const { error: updateError } = await db.from("catering_quote_requests").update({ notification_status: "accepted", notification_id: result.id }).eq("id", saved.id);
      if (updateError) throw updateError;
      notificationSent = true;
      console.log("Catering owner email accepted", { requestId: saved.id, messageId: result.id });
    } catch (emailError) {
      const reason = emailError instanceof Error ? emailError.message : "Email failed";
      await db.from("catering_quote_requests").update({ notification_status: "failed", notification_error: reason }).eq("id", saved.id);
      console.error("Catering notification failed", { requestId: saved.id, reason });
    }
    return respond({ success: true, id: saved.id, notificationSent });
  } catch {
    console.error("Catering request could not be saved");
    return respond({ error: "Votre demande n’a pas pu être enregistrée. Veuillez réessayer." }, 500);
  }
});