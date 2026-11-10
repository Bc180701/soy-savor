import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export default function CateringRequests() {
  const [requests, setRequests] = useState<Tables<"catering_quote_requests">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const load = async () => {
    setLoading(true); setError("");
    const { data, error } = await supabase.from("catering_quote_requests").select("*").order("created_at", { ascending: false }).order("id").range(page * 25, page * 25 + 24);
    if (error) setError("Impossible de charger les demandes.");
    else setRequests(data || []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [page]);
  return <section className="space-y-5">
    <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">Demandes de devis traiteur</h2><Button variant="outline" size="icon" title="Actualiser" aria-label="Actualiser les demandes" onClick={load}><RotateCcw /></Button></div>
    {loading ? <p>Chargement…</p> : error ? <p role="alert">{error}</p> : !requests.length ? <p className="text-muted-foreground">Aucune demande.</p> : requests.map(r => <article key={r.id} className="border rounded-lg bg-card p-5 space-y-3">
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{r.company || r.name} — {r.audience === "business" ? "Entreprise" : "Particulier"}</h3><span className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</span></div>
      <p>{r.event_type} · {r.event_date.split("-").reverse().join("/")} · {r.guests} personnes</p>
      <p>{r.location}</p>
      <p className="break-words">{r.name} · <a className="underline" href={`mailto:${encodeURIComponent(r.email)}`}>{r.email}</a> · <a className="underline" href={`tel:${r.phone.replace(/[^+\d]/g, "")}`}>{r.phone}</a></p>
      {r.needs && <p className="whitespace-pre-wrap">{r.needs}</p>}
      <p className="text-sm text-muted-foreground">{r.notification_status === "accepted" ? "E-mail accepté par le service d’envoi" : r.notification_status === "failed" ? "Échec de l’e-mail — demande conservée ici" : "E-mail en attente"}</p>
    </article>)}
    <div className="flex justify-end gap-3"><Button variant="outline" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>Précédent</Button><Button variant="outline" disabled={requests.length < 25 || loading} onClick={() => setPage(p => p + 1)}>Suivant</Button></div>
  </section>;
}