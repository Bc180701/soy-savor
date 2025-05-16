
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

// Interface for the response from create_admin_user RPC function
interface CreateAdminResponse {
  user_id: string;
  email: string;
  success: boolean;
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
        // Instead of trying to use userIds parameter, we'll fetch users individually
        const adminUsersData: AdminUser[] = [];
        
        for (const role of roles) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(role.user_id);
          
          if (userError) {
            console.error(`Error fetching user ${role.user_id}:`, userError);
            continue;
          }
          
          if (userData && userData.user) {
            adminUsersData.push({
              id: userData.user.id,
              email: userData.user.email || "",
              created_at: userData.user.created_at,
            });
          }
        }
        
        setAdminUsers(adminUsersData);
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
    console.log("Creating admin with email:", email);

    try {
      if (!email || !password) {
        throw new Error("L'email et le mot de passe sont requis");
      }
      
      if (password.length < 8) {
        throw new Error("Le mot de passe doit contenir au moins 8 caractères");
      }

      // 1. Create the user using auth.users directly via the RPC function
      console.log("Calling create_admin_user RPC");
      const { data, error: userError } = await supabase.rpc(
        'create_admin_user',
        { admin_email: email, admin_password: password }
      );

      if (userError) {
        console.error("Error creating admin user:", userError);
        throw userError;
      }

      console.log("Admin creation response:", data);
      
      if (!data) {
        throw new Error("Aucune réponse reçue du serveur lors de la création de l'utilisateur");
      }
      
      // Use type assertion with better safety
      const adminResponse = data as unknown as CreateAdminResponse;
      
      if (!adminResponse.user_id || !adminResponse.success) {
        console.error("Invalid admin creation response:", adminResponse);
        throw new Error("Erreur lors de la création de l'administrateur");
      }
      
      console.log("Admin created successfully with ID:", adminResponse.user_id);
      console.log("Now sending welcome email");
      
      // 2. Send welcome email with credentials
      const { data: authData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting auth session:", sessionError);
        throw new Error("Impossible de récupérer votre session");
      }
      
      if (!authData.session?.access_token) {
        console.error("No auth session found for sending email");
        throw new Error("Session non disponible");
      }
      
      // Call the send-admin-welcome edge function
      console.log("Sending welcome email to:", email);
      
      const response = await fetch('https://tdykegnmomyyucbhslok.supabase.co/functions/v1/send-admin-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      const responseData = await response.json();
      console.log("Email API response:", responseData);
      
      if (!response.ok) {
        console.warn("Problème lors de l'envoi du mail de bienvenue:", responseData);
        // On continue même si l'envoi de l'email échoue
      } else {
        console.log("Email de bienvenue envoyé avec succès");
      }

      // 3. Update UI and reset form
      toast({
        title: "Administrateur créé",
        description: `${email} a été ajouté comme administrateur et a reçu un email avec ses identifiants.`,
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
