import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Copy, Trash2, KeyRound, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { deliverySlugForRestaurant } from "@/utils/deliveryPortal";

interface AccessCode { id: string; label: string; is_active: boolean; last_used_at: string | null; created_at: string; }

const db = supabase as any;

const fmt = (d: string | null) => d ? new Date(d).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }) : "Jamais";

const DeliveryAccessManager = () => {
  const { currentRestaurant } = useRestaurantContext();
  const restaurantId = currentRestaurant?.id;
  const slug = deliverySlugForRestaurant(restaurantId);
  const url = slug ? `${window.location.origin}/livraison/${slug}` : "";
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [label, setLabel] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    const { data, error } = await db.from("delivery_access_codes")
      .select("id,label,is_active,last_used_at,created_at").eq("restaurant_id", restaurantId).order("created_at");
    if (error) toast.error("Chargement impossible");
    setCodes(data ?? []);
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  const generate = () => setPassword(String(Math.floor(100000 + Math.random() * 900000)));

  const create = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const { error } = await db.rpc("delivery_admin_create_code", { p_restaurant_id: restaurantId, p_label: label, p_password: password });
    setSaving(false);
    if (error) return toast.error(error.message || "Création impossible");
    toast.success(`Mot de passe créé pour ${label}`, { description: `Notez-le : ${password} (il ne sera plus affiché)`, duration: 15000 });
    setLabel(""); setPassword("");
    load();
  };

  const toggle = async (c: AccessCode) => {
    const { error } = await db.from("delivery_access_codes").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) return toast.error("Modification impossible");
    load();
  };

  const remove = async (c: AccessCode) => {
    if (!confirm(`Supprimer le mot de passe de ${c.label} ? Il sera déconnecté immédiatement.`)) return;
    const { error } = await db.from("delivery_access_codes").delete().eq("id", c.id);
    if (error) return toast.error("Suppression impossible");
    load();
  };

  if (!slug) return <p className="text-muted-foreground">Sélectionnez un restaurant.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h3 className="font-semibold">Lien de la page livraison — {currentRestaurant?.name}</h3>
        <div className="flex gap-2 flex-wrap">
          <Input readOnly value={url} className="flex-1 min-w-[220px]" />
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("Lien copié"))}><Copy className="h-4 w-4 mr-1" />Copier</Button>
          <Button variant="outline" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Ouvrir</a></Button>
        </div>
        <p className="text-sm text-muted-foreground">Le livreur saisit son mot de passe en début de service ; la connexion dure 5 heures.</p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="font-semibold">Ajouter un mot de passe</h3>
        <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
          <Input placeholder="Nom du livreur" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input placeholder="Mot de passe (4 min.)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button variant="outline" onClick={generate}><KeyRound className="h-4 w-4 mr-1" />Générer</Button>
          <Button onClick={create} disabled={saving || !label.trim() || password.length < 4}>Ajouter</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card divide-y">
        {codes.length === 0 && <p className="p-4 text-muted-foreground">Aucun mot de passe pour ce restaurant.</p>}
        {codes.map((c) => (
          <div key={c.id} className="p-4 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <div className="font-medium">{c.label}</div>
              <div className="text-xs text-muted-foreground">Créé le {fmt(c.created_at)} · Dernière connexion : {fmt(c.last_used_at)}</div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={c.is_active} onCheckedChange={() => toggle(c)} />{c.is_active ? "Actif" : "Désactivé"}
            </label>
            <Button variant="ghost" size="icon" onClick={() => remove(c)} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeliveryAccessManager;
