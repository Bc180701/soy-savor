
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import DashboardStats from "./DashboardStats";
import ProductManager from "./ProductManager";
import OrderList from "../OrderList";
import UsersList from "./UsersList";
import PromotionsManager from "./PromotionsManager";
import HomepageEditor from "./HomepageEditor";
import OpeningHoursManager from "./OpeningHoursManager";
import DeliveryZonesManager from "./DeliveryZonesManager";
import IngredientsManager from "./IngredientsManager";
import OrderingLockControl from "./OrderingLockControl";
import RestaurantSelector from "./RestaurantSelector";
import AdminInviteManager from "./AdminInviteManager";
import StripeKeysManager from "./StripeKeysManager";
import AdminSidebar from "./AdminSidebar";

const AdminManager = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardStats />;
      case "orders":
        return <OrderList />;
      case "products":
        return <ProductManager />;
      case "users":
        return <UsersList />;
      case "promotions":
        return <PromotionsManager />;
      case "homepage":
        return <HomepageEditor />;
      case "admins":
        return <AdminInviteManager />;
      case "stripe-keys":
        return <StripeKeysManager />;
      case "settings":
        return (
          <div className="grid gap-6">
            <OrderingLockControl />
            <OpeningHoursManager />
            <DeliveryZonesManager />
            <IngredientsManager />
          </div>
        );
      default:
        return <DashboardStats />;
    }
  };

  const getSectionTitle = () => {
    const titles = {
      dashboard: "Tableau de bord",
      orders: "Commandes",
      products: "Produits",
      users: "Utilisateurs",
      promotions: "Promotions",
      homepage: "Page d'accueil",
      admins: "Administrateurs",
      "stripe-keys": "Clés Stripe",
      settings: "Paramètres"
    };
    return titles[activeSection as keyof typeof titles] || "Administration";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-3"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{getSectionTitle()}</h1>
            </div>
            <RestaurantSelector />
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManager;
