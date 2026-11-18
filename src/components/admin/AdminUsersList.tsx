
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Users, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

const AdminUsersList = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAdminUsers = async () => {
    try {
      setIsLoading(true);
      setLoadFailed(false);
      const { data: usersData, error: usersError } = await supabase.functions.invoke<{
        success: boolean;
        users: AdminUser[];
      }>('get-admin-users', { body: {} });

      if (usersError || !usersData?.success || !Array.isArray(usersData.users)) {
        throw usersError ?? new Error("Réponse invalide de la liste des administrateurs");
      }

      setAdminUsers(usersData.users);
    } catch (error) {
      console.error("Erreur lors de la récupération des administrateurs:", error);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (userId: string, userEmail: string) => {
    try {
      setDeletingUserId(userId);
      console.log(`🗑️ Suppression de l'administrateur: ${userEmail} (${userId})`);

      // Supprimer l'utilisateur via la fonction Edge Function
      const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (deleteError) {
        console.error("❌ Erreur lors de la suppression:", deleteError);
        throw new Error(deleteError.message || "Erreur lors de la suppression de l'utilisateur");
      }

      if (!deleteResult?.success) {
        throw new Error(deleteResult?.error || "Échec de la suppression de l'utilisateur");
      }

      console.log("✅ Utilisateur supprimé avec succès");

      toast({
        title: "Administrateur supprimé",
        description: `L'administrateur ${userEmail} a été supprimé avec succès`
      });

      // Actualiser la liste
      await fetchAdminUsers();

    } catch (error: any) {
      console.error("💥 Erreur lors de la suppression:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'administrateur"
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des Administrateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Chargement des administrateurs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Liste des Administrateurs
        </CardTitle>
        <CardDescription>
          Gérez les comptes administrateurs du système
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadFailed ? (
          <div className="space-y-3 py-8 text-center">
            <p role="alert">Impossible de charger la liste des administrateurs.</p>
            <Button variant="outline" onClick={fetchAdminUsers}>Réessayer</Button>
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun administrateur trouvé</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Supprimer l'administrateur
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer l'administrateur <strong>{user.email}</strong> ?
                            Cette action est irréversible et supprimera définitivement le compte utilisateur.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAdmin(user.id, user.email)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
      </CardContent>
    </Card>
  );
};

export default AdminUsersList;
