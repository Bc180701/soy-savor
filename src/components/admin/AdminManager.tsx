
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
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "administrateur");

      if (rolesError) throw rolesError;

      if (roles && roles.length > 0) {
        const userIds = roles.map((role) => role.user_id);
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
          userIds: userIds,
        });

        if (usersError) throw usersError;

        const adminUsers = users.users.map((user) => ({
          id: user.id,
          email: user.email || "",
          created_at: user.created_at,
        }));

        setAdminUsers(adminUsers);
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
      // 1. Create the user with email and password
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

      if (userError) throw userError;

      // 2. Add the user to the administrateur role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userData.user.id,
          role: "administrateur",
        });

      if (roleError) throw roleError;

      // 3. Update UI and reset form
      toast({
        title: "Administrateur créé",
        description: `${email} a été ajouté comme administrateur.`,
      });
      setEmail("");
      setPassword("");
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
      // 1. Remove admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "administrateur");

      if (roleError) throw roleError;

      // 2. Update the UI
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
