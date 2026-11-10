import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navigation, Phone, LogOut, RefreshCw, Lock, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  DELIVERY_RESTAURANTS, buildNavAddress, clearDeliverySession, loadDeliverySession,
  saveDeliverySession, StoredDeliverySession,
} from "@/utils/deliveryPortal";

interface DeliveryOrder {
  id: string; status: string; scheduled_for: string;
  client_name?: string; client_phone?: string;
  delivery_street?: string; delivery_city?: string; delivery_postal_code?: string;
  delivery_instructions?: string; customer_notes?: string;
  total: number; items_summary?: any;
}

const rpc = supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }>;

const timeOf = (s: string) => (s?.match(/T?(\d{2}:\d{2})/)?.[1] ?? "");

const STATUS: Record<string, { label: string; cls: string }> = {
  "out-for-delivery": { label: "En livraison", cls: "bg-orange-500 text-white" },
  delivered: { label: "Livrée", cls: "bg-green-600 text-white" },
  ready: { label: "Prête", cls: "bg-primary text-primary-foreground" },
};

const itemsOf = (summary: any): { name: string; quantity: number }[] => {
  const arr = Array.isArray(summary) ? summary : Array.isArray(summary?.items) ? summary.items : [];
  return arr.map((i: any) => ({ name: i.name ?? i.n ?? "Article", quantity: Number(i.quantity ?? i.q ?? 1) }));
};

const Livraison = () => {
  const { slug = "" } = useParams();
  const restaurant = DELIVERY_RESTAURANTS[slug];
  const [session, setSession] = useState<StoredDeliverySession | null>(() => loadDeliverySession(slug));
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    document.title = restaurant ? `Livraisons ${restaurant.name} — SushiEats` : "Livraisons — SushiEats";
  }, [restaurant]);

  const logout = useCallback(() => {
    clearDeliverySession(slug);
    setSession(null);
    setOrders([]);
  }, [slug]);

  const fetchOrders = useCallback(async () => {
    const s = loadDeliverySession(slug);
    if (!s) return logout();
    setLoading(true);
    const { data, error } = await rpc("delivery_get_orders", { p_token: s.token });
    setLoading(false);
    if (error) return;
    if (!data?.ok) {
      toast.error("Accès expiré ou désactivé");
      return logout();
    }
    setOrders(data.orders ?? []);
  }, [slug, logout]);

  useEffect(() => {
    if (!session) return;
    fetchOrders();
    const id = setInterval(fetchOrders, 30000);
    const onVis = () => document.visibilityState === "visible" && fetchOrders();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [session, fetchOrders]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !password) return;
    setLoggingIn(true);
    const { data, error } = await rpc("delivery_login", { p_restaurant_id: restaurant.id, p_password: password });
    setLoggingIn(false);
    if (error || !data?.ok) return toast.error("Mot de passe incorrect");
    const s = { token: data.token, expiresAt: data.expires_at, label: data.label };
    saveDeliverySession(slug, s);
    setPassword("");
    setSession(s);
  };

  const updateStatus = async (id: string, status: string) => {
    const s = loadDeliverySession(slug);
    if (!s) return logout();
    const { data } = await rpc("delivery_update_status", { p_token: s.token, p_order_id: id, p_status: status });
    if (data?.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success(status === "delivered" ? "Commande livrée" : "Partie en livraison");
    } else if (data?.reason === "session") logout();
    else toast.error("Mise à jour impossible");
  };

  if (!restaurant) {
    return <div className="min-h-[100dvh] grid place-items-center p-6 text-center bg-background text-foreground">Page introuvable</div>;
  }

  if (!session) {
    return (
      <main className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center p-5">
        <form onSubmit={login} className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 grid place-items-center"><Lock className="h-6 w-6 text-primary" /></div>
            <h1 className="text-2xl font-bold">Livraisons</h1>
            <p className="text-muted-foreground">SushiEats {restaurant.name}</p>
          </div>
          <Input type="password" autoFocus inputMode="text" autoComplete="current-password" placeholder="Mot de passe livreur"
            value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 text-lg" />
          <Button type="submit" disabled={loggingIn || !password} className="w-full h-14 text-lg">
            {loggingIn ? "Vérification…" : "Commencer le service"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">Connexion valable 5 heures sur ce téléphone.</p>
        </form>
      </main>
    );
  }

  const active = orders.filter((o) => o.status !== "delivered");
  const done = orders.filter((o) => o.status === "delivered");

  const renderOrder = (o: DeliveryOrder) => {
    const address = buildNavAddress(o.delivery_street, o.delivery_postal_code, o.delivery_city);
    const fullAddress = [o.delivery_street, [o.delivery_postal_code, o.delivery_city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const st = STATUS[o.status];
    const items = itemsOf(o.items_summary);
    const isOpen = open === o.id;
    return (
      <article key={o.id} className="rounded-2xl border bg-card text-card-foreground p-4 space-y-3 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-3xl font-bold tabular-nums">{timeOf(o.scheduled_for)}</div>
            <div className="font-semibold text-lg leading-tight">{o.client_name || "Client"}</div>
          </div>
          <div className="text-right space-y-1">
            {st && <Badge className={st.cls}>{st.label}</Badge>}
            <div className="text-sm text-muted-foreground">#{o.id.slice(0, 8)}</div>
            <div className="font-semibold">{Number(o.total).toFixed(2)} €</div>
          </div>
        </div>

        <button type="button" onClick={() => navigator.clipboard?.writeText(fullAddress).then(() => toast.success("Adresse copiée"))}
          className="w-full text-left text-base leading-snug flex gap-2 items-start">
          <span className="flex-1">{fullAddress || "Adresse manquante"}</span>
          <Copy className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
        </button>
        {(o.delivery_instructions || o.customer_notes) && (
          <p className="text-sm rounded-lg bg-muted p-2">{o.delivery_instructions || o.customer_notes}</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button asChild variant="outline" className="h-12">
            <a href={`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4 mr-1" />Waze</a>
          </Button>
          <Button asChild variant="outline" className="h-12">
            <a href={`https://maps.apple.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer">Plans</a>
          </Button>
          <Button asChild variant="outline" className="h-12" disabled={!o.client_phone}>
            <a href={o.client_phone ? `tel:${o.client_phone.replace(/\s/g, "")}` : undefined}><Phone className="h-4 w-4 mr-1" />Appel</a>
          </Button>
        </div>

        {items.length > 0 && (
          <div>
            <button type="button" onClick={() => setOpen(isOpen ? null : o.id)} className="flex items-center gap-1 text-sm text-muted-foreground">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{items.length} article(s)
            </button>
            {isOpen && (
              <ul className="mt-2 text-sm space-y-1">
                {items.map((i, idx) => <li key={idx}><span className="font-semibold">{i.quantity}×</span> {i.name}</li>)}
              </ul>
            )}
          </div>
        )}

        {o.status !== "delivered" && (
          o.status === "out-for-delivery" ? (
            <Button className="w-full h-14 text-lg" onClick={() => updateStatus(o.id, "delivered")}>Marquer livrée</Button>
          ) : (
            <Button className="w-full h-14 text-lg" variant="secondary" onClick={() => updateStatus(o.id, "out-for-delivery")}>Je pars en livraison</Button>
          )
        )}
      </article>
    );
  };

  return (
    <main className="min-h-[100dvh] bg-background text-foreground pb-10">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg leading-tight">Livraisons {restaurant.name}</h1>
          <p className="text-xs text-muted-foreground">{session.label} · jusqu'à {new Date(session.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={fetchOrders} aria-label="Actualiser"><RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button size="icon" variant="ghost" onClick={logout} aria-label="Se déconnecter"><LogOut className="h-5 w-5" /></Button>
        </div>
      </header>
      <section className="p-4 space-y-4 max-w-xl mx-auto">
        {active.length === 0 && <p className="text-center text-muted-foreground py-10">Aucune livraison à faire pour l'instant.</p>}
        {active.map(renderOrder)}
        {done.length > 0 && (
          <div className="pt-2">
            <Button variant="ghost" className="w-full" onClick={() => setShowDone(!showDone)}>
              {showDone ? "Masquer" : "Voir"} les livrées ({done.length})
            </Button>
            {showDone && <div className="space-y-4 mt-3">{done.map(renderOrder)}</div>}
          </div>
        )}
      </section>
    </main>
  );
};

export default Livraison;
