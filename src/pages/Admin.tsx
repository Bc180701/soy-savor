import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import OrderList from "@/components/OrderList";
import DashboardStats from "@/components/admin/DashboardStats";
import OrdersChart from "@/components/admin/OrdersChart";
import StatusDistribution from "@/components/admin/StatusDistribution";
import PopularProductsChart from "@/components/admin/PopularProductsChart";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          setIsLoading(false);
          toast({
            title: "Accès non autorisé",
            description: "Vous devez être connecté pour accéder à cette page.",
            variant: "destructive",
          });
          return;
        }
        
        // Vérifier si l'utilisateur a le rôle d'administrateur
        const { data, error } = await supabase.rpc(
          'has_role',
          { user_id: session.user.id, role: 'administrateur' }
        );
        
        if (error) throw error;
        
        setIsAdmin(!!data);
        
        if (!data) {
          toast({
            title: "Accès non autorisé",
            description: "Vous n'avez pas les droits d'administrateur pour accéder à cette page.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        setIsAdmin(false);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier vos droits d'accès.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4 flex justify-center items-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-24 px-4 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès Restreint</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les droits nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold mb-8">Administration</h1>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <div className="space-y-12">
            <DashboardStats />
            
            <div className="w-full">
              <OrdersChart />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <StatusDistribution />
              <PopularProductsChart />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="orders">
          <OrderList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
