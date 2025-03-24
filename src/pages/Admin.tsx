
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Settings,
  AlertCircle
} from "lucide-react";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          return;
        }
        
        // Vérifier si l'utilisateur a le rôle d'administrateur
        const { data, error } = await supabase.rpc(
          'has_role',
          { user_id: session.user.id, role: 'admin' }
        );
        
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        toast({
          variant: "destructive",
          title: "Erreur d'accès",
          description: "Impossible de vérifier vos autorisations."
        });
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    toast({
      variant: "destructive",
      title: "Accès refusé",
      description: "Vous n'avez pas les autorisations nécessaires pour accéder à cette page."
    });
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
      </div>

      <Tabs defaultValue="commandes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="commandes" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="utilisateurs" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="statistiques" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Statistiques</span>
          </TabsTrigger>
          <TabsTrigger value="parametres" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="commandes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dernières commandes</CardTitle>
              <CardDescription>
                Gérez les commandes récentes et modifiez leur statut.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Les commandes s'afficheront ici</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Mettez à jour les statuts des commandes pour tenir les clients informés.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="utilisateurs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>
                Gérez les comptes utilisateurs et leurs autorisations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Les utilisateurs s'afficheront ici</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Ajoutez, modifiez ou supprimez des comptes utilisateurs.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistiques" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de vente</CardTitle>
              <CardDescription>
                Consultez les statistiques de vente et les tendances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Les statistiques s'afficheront ici</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Consultez les données analytiques pour optimiser vos ventes.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="parametres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du site</CardTitle>
              <CardDescription>
                Configurez les paramètres généraux du site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Les paramètres s'afficheront ici</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Ajustez les configurations pour optimiser l'expérience utilisateur.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
