
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutGrid, 
  ShoppingBag, 
  FileText, 
  Tag, 
  Settings, 
  Users,
  LayoutTemplate,
  Lock,
  Clock,
  Phone,
  Menu
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
import PokeIngredientsManager from "@/components/admin/PokeIngredientsManager";
import OpeningHoursManager from "@/components/admin/OpeningHoursManager";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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

  const renderActiveContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardStats />;
      case "orders":
        return <OrderList />;
      case "products":
        return <ProductManager />;
      case "categories":
        return <CategoriesTable />;
      case "featured":
        return <FeaturedProductsManager />;
      case "homepage":
        return <HomepageEditor />;
      case "contact":
        return <HomepageEditor />;
      case "users":
        return <UsersList />;
      case "admins":
        return <AdminManager />;
      case "settings":
        return (
          <div className={`grid grid-cols-1 gap-6 ${isMobile ? '' : 'md:grid-cols-2'}`}>
            <OrderingLockControl />
          </div>
        );
      case "opening-hours":
        return <OpeningHoursManager />;
      case "poke-ingredients":
        return <PokeIngredientsManager />;
      default:
        return <DashboardStats />;
    }
  };

  // Définition des éléments de menu
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutGrid className="h-4 w-4" /> },
    { id: "orders", label: "Commandes", icon: <FileText className="h-4 w-4" /> },
    { id: "products", label: "Produits", icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "categories", label: "Catégories", icon: <Tag className="h-4 w-4" /> },
    { id: "featured", label: "Mise en avant", icon: <Settings className="h-4 w-4" /> },
    { id: "homepage", label: "Page d'accueil", icon: <LayoutTemplate className="h-4 w-4" /> },
    { id: "contact", label: "Contact", icon: <Phone className="h-4 w-4" /> },
    { id: "users", label: "Utilisateurs", icon: <Users className="h-4 w-4" /> },
    { id: "admins", label: "Administrateurs", icon: <Users className="h-4 w-4" /> },
    { id: "settings", label: "Paramètres", icon: <Lock className="h-4 w-4" /> },
    { id: "opening-hours", label: "Horaires", icon: <Clock className="h-4 w-4" /> },
    { id: "poke-ingredients", label: "Ingrédients Poké", icon: <ShoppingBag className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex w-full min-h-screen pt-[72px]">
          <Sidebar collapsible="offcanvas" side="left" variant="sidebar" className="bg-white border-r">
            <SidebarHeader className={`border-b bg-white ${isMobile ? 'p-2' : 'p-4'}`}>
              <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>Administration</h2>
            </SidebarHeader>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <SidebarContent className="bg-white">
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 ${isMobile ? 'text-sm py-2' : ''}`}
                        tooltip={item.label}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarContent>
            </ScrollArea>
          </Sidebar>
          
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Header avec bouton menu */}
            <div className={`flex items-center justify-between border-b bg-white ${isMobile ? 'p-2' : 'p-4'}`}>
              <div className="flex items-center gap-3">
                <SidebarTrigger className={`flex items-center gap-2 border border-gray-300 rounded-md hover:bg-gray-50 ${isMobile ? 'px-2 py-1' : 'px-3 py-2'}`}>
                  <Menu className="h-4 w-4" />
                  {!isMobile && <span className="hidden sm:inline">Menu</span>}
                </SidebarTrigger>
                <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>Administration</h1>
              </div>
            </div>
            
            <div className={`flex-1 overflow-auto ${
              isMobile && activeTab === 'orders' ? 'p-0' : 
              isMobile ? 'p-2' : 'p-6'
            }`}>
              <div className={`${
                isMobile && activeTab === 'orders' ? 'w-full max-w-full' : 
                isMobile ? 'w-full' : 'container mx-auto max-w-7xl'
              }`}>
                <div className={`${
                  isMobile && activeTab === 'orders' ? '' : 
                  isMobile ? '' : 'bg-white p-6 rounded-lg shadow-sm'
                }`}>
                  {/* Affichage du titre de la section active */}
                  {!(isMobile && activeTab === 'orders') && !isMobile && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold">
                        {menuItems.find(item => item.id === activeTab)?.label}
                      </h2>
                    </div>
                  )}
                  {renderActiveContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Admin;
