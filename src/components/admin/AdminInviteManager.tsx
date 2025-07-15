
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Shield, UserPlus } from "lucide-react";

const AdminInviteManager = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateRandomPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setPassword(newPassword);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔄 Création d'un nouvel administrateur...");
      
      // Créer l'utilisateur admin via la fonction edge
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-admin-user', {
        body: { email, password }
      });

      if (createError) {
        console.error("❌ Erreur lors de la création:", createError);
        throw new Error(createError.message || "Erreur lors de la création de l'administrateur");
      }

      if (!createResult?.success) {
        throw new Error(createResult?.error || "Échec de la création de l'administrateur");
      }

      console.log("✅ Administrateur créé, envoi de l'email...");

      // Envoyer l'email d'accueil avec Resend
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-admin-welcome', {
        body: { email, password }
      });

      if (emailError) {
        console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
        // L'admin est créé mais l'email n'a pas pu être envoyé
        toast({
          title: "Administrateur créé",
          description: `L'administrateur ${email} a été créé mais l'email n'a pas pu être envoyé. Mot de passe: ${password}`,
          variant: "default"
        });
      } else {
        console.log("✅ Email envoyé avec succès");
        toast({
          title: "Administrateur invité",
          description: `L'invitation a été envoyée à ${email}`,
        });
      }

      // Réinitialiser le formulaire
      setEmail("");
      setPassword("");

    } catch (error: any) {
      console.error("💥 Erreur complète:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer l'administrateur"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gestion des Administrateurs
        </h3>
        <p className="text-muted-foreground">
          Inviter de nouveaux administrateurs à accéder au système
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un Administrateur
          </CardTitle>
          <CardDescription>
            Créer un nouveau compte administrateur et envoyer les identifiants par email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password">Mot de passe temporaire</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  className="whitespace-nowrap"
                >
                  Générer
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Un mot de passe sécurisé sera généré automatiquement si vous laissez ce champ vide
              </p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Créer et Inviter
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInviteManager;
