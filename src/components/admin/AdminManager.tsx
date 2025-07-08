
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
      console.log("Récupération des administrateurs...");
      
      // Récupérer les utilisateurs avec le rôle administrateur depuis la table user_roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "administrateur");

      console.log("Rôles admin trouvés:", adminRoles);

      if (rolesError) {
        console.error("Erreur lors de la récupération des rôles:", rolesError);
        throw rolesError;
      }

      if (adminRoles && adminRoles.length > 0) {
        // Appeler l'edge function pour récupérer les détails des utilisateurs admin
        const { data: adminUsersData, error: usersError } = await supabase.functions.invoke('get-admin-users', {
          body: { userIds: adminRoles.map(role => role.user_id) }
        });

        console.log("Utilisateurs admin récupérés:", adminUsersData);

        if (usersError) {
          console.error("Erreur lors de la récupération des utilisateurs:", usersError);
          setAdminUsers([]);
        } else {
          setAdminUsers(adminUsersData?.users || []);
        }
      } else {
        console.log("Aucun rôle administrateur trouvé");
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

  // Handle create admin using the new edge function
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== DÉBUT CRÉATION ADMIN ===");
    console.log("Email:", email);
    console.log("Password length:", password?.length);
    
    setIsLoading(true);
    
    try {
      // Validation
      if (!email || !password) {
        console.error("Email ou mot de passe manquant");
        throw new Error("L'email et le mot de passe sont requis");
      }
      
      if (password.length < 6) {
        console.error("Mot de passe trop court");
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      console.log("Validation OK, appel de l'edge function...");

      // Utiliser l'edge function pour créer l'admin
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: email,
          password: password
        }
      });

      console.log("Résultat edge function:", { functionData, functionError });

      if (functionError) {
        console.error("Erreur lors de l'appel de l'edge function:", functionError);
        throw new Error(`Erreur lors de la création de l'administrateur: ${functionError.message}`);
      }

      if (!functionData?.success) {
        console.error("Échec de la création:", functionData);
        throw new Error(functionData?.error || "Erreur inconnue lors de la création de l'administrateur");
      }

      console.log("Administrateur créé avec succès:", functionData.user);

      // Envoyer l'email de bienvenue admin
      try {
        console.log("Invocation de la fonction send-admin-welcome...");
        
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-admin-welcome', {
          body: {
            email: email,
            password: password
          }
        });

        console.log("Résultat email:", { emailData, emailError });

        if (emailError) {
          console.error("Erreur lors de l'envoi de l'email:", emailError);
          throw new Error(`Erreur d'envoi d'email: ${emailError.message}`);
        }

        console.log("Email envoyé avec succès");
        
        toast({
          title: "Administrateur créé avec succès",
          description: `${email} a été ajouté comme administrateur et a reçu un email avec ses identifiants.`,
        });
      } catch (emailError: any) {
        console.error("Erreur lors de l'envoi de l'email:", emailError);
        
        // L'admin a été créé mais l'email n'a pas pu être envoyé
        toast({
          title: "Administrateur créé",
          description: `${email} a été ajouté comme administrateur, mais l'email de bienvenue n'a pas pu être envoyé. Veuillez lui communiquer ses identifiants manuellement.`,
          variant: "default"
        });
      }
      
      // Reset form
      setEmail("");
      setPassword("");
      
      // Refresh admin users list
      console.log("Rafraîchissement de la liste des admins...");
      setTimeout(() => {
        fetchAdminUsers();
      }, 1000);
      
    } catch (error: any) {
      console.error("=== ERREUR CRÉATION ADMIN ===", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la création de l'administrateur.",
      });
    } finally {
      console.log("=== FIN CRÉATION ADMIN ===");
      setIsLoading(false);
    }
  };

  // Handle delete admin - nouvelle version avec suppression complète
  const handleDeleteAdmin = async (userId: string, userEmail: string) => {
    try {
      console.log("Suppression complète de l'admin:", userId, userEmail);
      
      // 1. Supprimer le rôle administrateur
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "administrateur");

      if (roleError) {
        console.error("Erreur lors de la suppression du rôle:", roleError);
        throw roleError;
      }

      // 2. Supprimer le profil
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        console.error("Erreur lors de la suppression du profil:", profileError);
      }

      // 3. Supprimer les adresses
      const { error: addressError } = await supabase
        .from("user_addresses")
        .delete()
        .eq("user_id", userId);

      if (addressError) {
        console.error("Erreur lors de la suppression des adresses:", addressError);
      }

      // 4. Appeler la fonction edge pour supprimer le compte auth
      const { error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (deleteError) {
        console.error("Erreur lors de la suppression du compte:", deleteError);
        throw new Error(`Impossible de supprimer le compte: ${deleteError.message}`);
      }

      toast({
        title: "Administrateur supprimé",
        description: `L'administrateur ${userEmail} a été complètement supprimé.`,
      });

      fetchAdminUsers();
    } catch (error: any) {
      console.error("Error removing admin:", error);
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
            
            <div className="text-sm text-gray-600 bg-green-50 p-3 rounded">
              <strong>Info:</strong> Le compte sera directement utilisable après création avec les droits d'administrateur complets. Un email avec les identifiants sera automatiquement envoyé.
            </div>
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
                            Êtes-vous sûr de vouloir supprimer définitivement l'administrateur {admin.email} ? 
                            Cette action supprimera complètement le compte et toutes ses données. Cette action ne peut pas être annulée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Supprimer définitivement
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
