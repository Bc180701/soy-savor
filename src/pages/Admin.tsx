
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminManager from "@/components/admin/AdminManager";
import HomepageEditor from "@/components/admin/HomepageEditor";
import OpeningHoursManager from "@/components/admin/OpeningHoursManager";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          window.location.href = '/login';
          return;
        }

        setUser(session.user);

        const { data: userRole, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erreur lors de la récupération du rôle:', error);
          throw error;
        }

        if (userRole?.role === 'administrateur') {
          setIsAdmin(true);
        } else {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
            variant: "destructive",
          });
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la vérification de vos permissions.",
          variant: "destructive",
        });
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin mx-auto mb-4" />
          <p>Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas accès à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Administration</h1>
        <p className="text-muted-foreground">
          Gérez votre restaurant et personnalisez votre site web.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="homepage">Page d'accueil</TabsTrigger>
          <TabsTrigger value="hours">Horaires</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminManager />
        </TabsContent>

        <TabsContent value="homepage">
          <HomepageEditor />
        </TabsContent>

        <TabsContent value="hours">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Gestion des horaires</h2>
              <p className="text-muted-foreground">
                Configurez les horaires d'ouverture de votre restaurant.
              </p>
            </div>
            <OpeningHoursManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
