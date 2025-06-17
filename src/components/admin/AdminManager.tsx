
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

const AdminManager = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Fetch existing admin users
  const fetchAdminUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Récupérer les utilisateurs avec le rôle administrateur depuis la table user_roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "administrateur");

      if (rolesError) throw rolesError;

      if (adminRoles && adminRoles.length > 0) {
        // Pour chaque rôle d'admin, récupérer les informations depuis auth_users_view
        const { data: authUsers, error: usersError } = await supabase
          .from("auth_users_view")
          .select("id, email, created_at")
          .in("id", adminRoles.map(role => role.user_id));

        if (usersError) {
          console.error("Erreur lors de la récupération des utilisateurs:", usersError);
          setAdminUsers([]);
        } else {
          const adminUsersData: AdminUser[] = (authUsers || []).map(user => ({
            id: user.id!,
            email: user.email!,
            created_at: user.created_at!
          }));
          setAdminUsers(adminUsersData);
        }
      } else {
        setAdminUsers([]);
      }
    } catch (error) {
      console.error("Error fetching admin users:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de récupérer la liste des administrateurs.",
      });
      setAdminUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  // Handle create admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validation
      if (!email || !password) {
        throw new Error("L'email et le mot de passe sont requis");
      }
      
      if (password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      console.log("Création d'un nouvel administrateur:", email);

      // 1. Créer l'utilisateur avec signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (signUpError) {
        console.error("Erreur lors de la création:", signUpError);
        throw new Error(`Erreur lors de la création du compte: ${signUpError.message}`);
      }

      if (!signUpData.user?.id) {
        throw new Error("Aucun utilisateur créé");
      }

      console.log("Utilisateur créé avec succès:", signUpData.user.id);

      // 2. Assigner le rôle d'administrateur
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: signUpData.user.id,
          role: "administrateur"
        });

      if (roleError) {
        console.error("Erreur lors de l'assignation du rôle:", roleError);
        throw new Error(`Erreur lors de l'assignation du rôle: ${roleError.message}`);
      }

      console.log("Rôle administrateur assigné avec succès");

      // 3. Envoyer l'email de bienvenue (optionnel)
      try {
        const { data: authData } = await supabase.auth.getSession();
        const accessToken = authData?.session?.access_token;
        
        if (accessToken) {
          const emailResponse = await fetch('https://tdykegnmomyyucbhslok.supabase.co/functions/v1/send-admin-welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              email: email,
              password: password
            })
          });

          if (!emailResponse.ok) {
            console.warn("Attention: L'envoi de l'email de bienvenue a échoué");
          } else {
            console.log("Email de bienvenue envoyé avec succès");
          }
        }
      } catch (emailError) {
        console.warn("Attention: Échec de l'envoi de l'email:", emailError);
        // Ne pas faire échouer le processus pour l'email
      }

      // 4. Succès
      toast({
        title: "Administrateur créé",
        description: `${email} a été ajouté comme administrateur avec succès. Un email de confirmation a été envoyé.`,
      });
      
      // Reset form
      setEmail("");
      setPassword("");
      
      // Refresh admin users list
      fetchAdminUsers();
      
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la création de l'administrateur.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete admin
  const handleDeleteAdmin = async (userId: string, userEmail: string) => {
    try {
      // Supprimer le rôle admin
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "administrateur");

      if (roleError) throw roleError;

      // Mettre à jour l'interface
      toast({
        title: "Droits admin révoqués",
        description: `Les droits d'administrateur ont été retirés pour ${userEmail}.`,
      });
      fetchAdminUsers();
    } catch (error: any) {
      console.error("Error removing admin role:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la suppression de l'administrateur.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-medium mb-4">Ajouter un administrateur</h3>
        <form onSubmit={handleCreateAdmin}>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin" />
                  Création en cours...
                </span>
              ) : (
                <span className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer un administrateur
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-medium mb-4">Administrateurs actuels</h3>
        
        {isLoadingUsers ? (
          <div className="py-8 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun administrateur trouvé.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    {new Date(admin.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir retirer les droits d'administrateur pour {admin.email} ? Cette action ne supprime pas le compte utilisateur, seulement ses droits.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminManager;
