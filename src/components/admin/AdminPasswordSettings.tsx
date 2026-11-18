import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_PASSWORD_MIN_LENGTH, changeOwnAdminPassword } from "@/utils/adminPassword";

const messages = {
  "missing-current": "Saisissez votre mot de passe actuel.",
  "too-short": `Utilisez au moins ${ADMIN_PASSWORD_MIN_LENGTH} caractères.`,
  "mismatch": "Les deux nouveaux mots de passe ne correspondent pas.",
  "unchanged": "Le nouveau mot de passe doit être différent du mot de passe actuel.",
  "reauthentication-failed": "Impossible de vérifier votre mot de passe actuel. Vérifiez-le et réessayez.",
  "update-failed": "Impossible de modifier le mot de passe. Choisissez un autre mot de passe ou réessayez.",
};

export default function AdminPasswordSettings() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);

  const signOutEverywhere = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    return !error;
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = signOutPending ? (await signOutEverywhere() ? "done" : "sign-out-failed") :
        await changeOwnAdminPassword({
          async reauthenticate(password) {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user?.email) return false;
            const login = await supabase.auth.signInWithPassword({ email: user.email, password });
            return !login.error && login.data.user?.id === user.id;
          },
          async updatePassword(password, currentPassword) {
            // Older SDK types omit current_password, but updateUser forwards the field to Auth.
            const credentials = { password, current_password: currentPassword };
            const { error } = await supabase.auth.updateUser(credentials);
            return !error;
          },
          signOutEverywhere,
        }, current, next, confirmation);

      if (result === "done" || result === "sign-out-failed") {
        setCurrent("");
        setNext("");
        setConfirmation("");
        if (result === "done") {
          toast({ title: "Mot de passe modifié", description: "Reconnectez-vous avec votre nouveau mot de passe." });
        } else {
          setSignOutPending(true);
          setError("Mot de passe modifié, mais la déconnexion de tous les appareils n’a pas pu être confirmée.");
        }
      } else {
        setError(messages[result]);
      }
    } catch {
      setError("Connexion au serveur impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Mot de passe de mon compte</CardTitle>
        <CardDescription>Le changement déconnecte ce compte de tous les appareils, y compris celui-ci.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="max-w-md space-y-4">
          {!signOutPending && (
            <>
              <div className="space-y-2">
                <Label htmlFor="admin-current-password">Mot de passe actuel</Label>
                <Input id="admin-current-password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required disabled={busy} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-new-password">Nouveau mot de passe</Label>
                <Input id="admin-new-password" type="password" autoComplete="new-password" minLength={ADMIN_PASSWORD_MIN_LENGTH} value={next} onChange={(e) => setNext(e.target.value)} required disabled={busy} />
                <p className="text-sm text-muted-foreground">{ADMIN_PASSWORD_MIN_LENGTH} caractères minimum.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">Confirmer le nouveau mot de passe</Label>
                <Input id="admin-confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required disabled={busy} />
              </div>
            </>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "En cours…" : signOutPending ? "Réessayer la déconnexion" : "Modifier le mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}