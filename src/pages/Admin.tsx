
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutGrid, 
  ShoppingBag, 
  FileText, 
  Tag, 
  Settings, 
  Users,
  LayoutTemplate,
  Lock
} from "lucide-react";
import DashboardStats from "@/components/admin/DashboardStats";
import OrderList from "@/components/OrderList";
import ProductManager from "@/components/admin/ProductManager";
import CategoriesTable from "@/components/admin/CategoriesTable";
import FeaturedProductsManager from "@/components/admin/FeaturedProductsManager";
import AdminManager from "@/components/admin/AdminManager";
import HomepageEditor from "@/components/admin/HomepageEditor";
import UsersList from "@/components/admin/UsersList";
import OrderingLockControl from "@/components/admin/OrderingLockControl";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/login", { replace: true });
          return;
        }
        
        // Vérifier si l'utilisateur a le rôle d'administrateur
        const { data, error } = await supabase.rpc(
          'has_role',
          { user_id: session.user.id, role: 'administrateur' }
        );
        
        if (error) throw error;
        
        if (!data) {
          navigate("/", { replace: true });
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-[72px] pb-16 min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Administration</h1>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 grid grid-cols-3 md:grid-cols-9 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden md:inline">Produits</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden md:inline">Catégories</span>
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Mise en avant</span>
            </TabsTrigger>
            <TabsTrigger value="homepage" className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden md:inline">Page d'accueil</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Administrateurs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden md:inline">Paramètres</span>
            </TabsTrigger>
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
          
          <TabsContent value="homepage">
            <HomepageEditor />
          </TabsContent>
          
          <TabsContent value="users">
            <UsersList />
          </TabsContent>
          
          <TabsContent value="admins">
            <AdminManager />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <OrderingLockControl />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
