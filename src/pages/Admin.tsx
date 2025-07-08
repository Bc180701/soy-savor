
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RestaurantProvider } from "@/hooks/useRestaurantContext";
import RestaurantSelector from "@/components/admin/RestaurantSelector";
import AdminManager from "@/components/admin/AdminManager";
import ProductManager from "@/components/admin/ProductManager";
import DashboardStats from "@/components/admin/DashboardStats";
import CategoriesTable from "@/components/admin/CategoriesTable";
import FeaturedProductsManager from "@/components/admin/FeaturedProductsManager";
import OpeningHoursManager from "@/components/admin/OpeningHoursManager";
import HomepageEditor from "@/components/admin/HomepageEditor";
import OrderingLockControl from "@/components/admin/OrderingLockControl";
import OrderList from "@/components/OrderList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IngredientsManager from "@/components/admin/IngredientsManager";
import DeliveryZonesManager from "@/components/admin/DeliveryZonesManager";
import UsersList from "@/components/admin/UsersList";


const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Vérification de l'authentification admin...");
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session récupérée:", !!session);
        
        if (!session) {
          console.log("Aucune session trouvée, redirection vers login");
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate("/login");
          return;
        }
        
        setIsAuthenticated(true);
        
        // Vérifier le rôle admin avec la fonction RPC
        console.log("Vérification du rôle admin pour:", session.user.id);
        const { data: hasAdminRole, error: roleError } = await supabase.rpc(
          'has_role',
          { user_id: session.user.id, role: 'administrateur' }
        );
        
        let finalIsAdmin = false;
        
        if (roleError) {
          console.error("Erreur lors de la vérification du rôle:", roleError);
          // Fallback: vérifier directement dans la table user_roles
          const { data: fallbackRoleData, error: fallbackError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'administrateur')
            .single();
          
          if (fallbackError && fallbackError.code !== 'PGRST116') {
            console.error("Erreur lors de la vérification fallback du rôle:", fallbackError);
            throw fallbackError;
          }
          
          finalIsAdmin = !!fallbackRoleData;
          console.log("Utilisateur admin (fallback):", !!fallbackRoleData);
        } else {
          finalIsAdmin = !!hasAdminRole;
          console.log("Utilisateur admin:", !!hasAdminRole);
        }
        
        setIsAdmin(finalIsAdmin);

        if (!finalIsAdmin) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions pour accéder à cette page.",
            variant: "destructive"
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification d'authentification:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la vérification des permissions.",
          variant: "destructive"
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <RestaurantProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-11 gap-1 overflow-x-auto">
              <TabsTrigger value="dashboard" className="whitespace-nowrap">Tableau de bord</TabsTrigger>
              <TabsTrigger value="orders" className="whitespace-nowrap">Commandes</TabsTrigger>
              <TabsTrigger value="products" className="whitespace-nowrap">Produits</TabsTrigger>
              <TabsTrigger value="categories" className="whitespace-nowrap">Catégories</TabsTrigger>
              <TabsTrigger value="featured" className="whitespace-nowrap">Produits Vedettes</TabsTrigger>
              <TabsTrigger value="hours" className="whitespace-nowrap">Horaires</TabsTrigger>
              <TabsTrigger value="homepage" className="whitespace-nowrap">Page d'accueil</TabsTrigger>
              <TabsTrigger value="ordering" className="whitespace-nowrap">Configuration</TabsTrigger>
              <TabsTrigger value="delivery-zones" className="whitespace-nowrap">Zones livraison</TabsTrigger>
              <TabsTrigger value="ingredients" className="whitespace-nowrap">Ingrédients</TabsTrigger>
              <TabsTrigger value="admins" className="whitespace-nowrap">Administrateurs</TabsTrigger>
              <TabsTrigger value="users" className="whitespace-nowrap">Utilisateurs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <DashboardStats />
            </TabsContent>
            
            <TabsContent value="orders">
              <OrderList />
            </TabsContent>
            
            <TabsContent value="products">
              <ProductManager />
            </TabsContent>
            
            <TabsContent value="categories">
              <CategoriesTable />
            </TabsContent>
            
            <TabsContent value="featured">
              <FeaturedProductsManager />
            </TabsContent>
            
            <TabsContent value="hours">
              <OpeningHoursManager />
            </TabsContent>
            
            <TabsContent value="homepage">
              <HomepageEditor />
            </TabsContent>
            
            <TabsContent value="ordering">
              <OrderingLockControl />
            </TabsContent>
            
            <TabsContent value="delivery-zones">
              <DeliveryZonesManager />
            </TabsContent>
            
            <TabsContent value="ingredients">
              <IngredientsManager />
            </TabsContent>
            
            <TabsContent value="admins">
              <AdminManager />
            </TabsContent>
            
            <TabsContent value="users">
              <UsersList />
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center bg-white p-4 rounded-lg border shadow-sm">
              <span className="text-sm font-medium text-gray-700 mr-3">Restaurant :</span>
              <RestaurantSelector />
            </div>
          </div>
        </div>
      </div>
    </RestaurantProvider>
  );
};

export default Admin;
