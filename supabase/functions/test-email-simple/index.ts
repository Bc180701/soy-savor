import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    console.log("🔑 Clé Brevo:", brevoApiKey ? "présente" : "absente");
    
    if (!brevoApiKey) {
      throw new Error("Clé API Brevo manquante");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "SushiEats Test",
          email: "noreply@brevo.com",
        },
        to: [{ email }],
        subject: "Test Email Simple",
        htmlContent: "<p>Ceci est un test simple. Si vous recevez ce mail, ça marche !</p>",
      }),
    });

    console.log("📡 Status Brevo:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erreur Brevo:", errorData);
      throw new Error(`Brevo error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log("✅ Succès:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("💥 Erreur:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});