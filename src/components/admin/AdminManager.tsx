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
import AdminInviteManager from "./AdminInviteManager";
import AdminPermissionsManager from "./AdminPermissionsManager";
import StripeKeysManager from "./StripeKeysManager";
import PrintersManager from "./PrintersManager";
import SMSTestManager from "./SMSTestManager";
import BlockedTimeSlotsManager from "./BlockedTimeSlotsManager";
import AdminSidebar from "./AdminSidebar";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import TestOrderNotification from "./TestOrderNotification";
import { RenameProductImages } from "./RenameProductImages";
import { ReassignProductImages } from "./ReassignProductImages";
import DeliveryPhoneManager from "./DeliveryPhoneManager";
import SitemapManager from "./SitemapManager";

const AdminManager = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentRestaurant } = useRestaurantContext();
  
  // Enable order notifications for admins
  const { audioEnabled, enableAudio } = useOrderNotifications(true, currentRestaurant?.id);

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
      case "blocked-slots":
        return <BlockedTimeSlotsManager selectedRestaurant={currentRestaurant} />;
      case "promotions":
        return <PromotionsManager />;
      case "homepage":
        return <HomepageEditor />;
      case "admins":
        return <AdminInviteManager />;
      case "permissions":
        return <AdminPermissionsManager />;
      case "stripe-keys":
        return <StripeKeysManager />;
      case "printers":
        return <PrintersManager />;
      case "settings":
        return (
          <div className="grid gap-6">
            <OrderingLockControl />
            <DeliveryPhoneManager />
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Test de notifications</h3>
              <TestOrderNotification audioEnabled={audioEnabled} enableAudio={enableAudio} />
            </div>
            <OpeningHoursManager />
            <DeliveryZonesManager />
            <IngredientsManager />
            <SitemapManager />
            <div className="bg-white p-6 rounded-lg shadow-sm border">
            <RenameProductImages />
            <ReassignProductImages />
            </div>
            <SMSTestManager />
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
      "blocked-slots": "Créneaux bloqués",
      promotions: "Promotions",
      homepage: "Page d'accueil",
      admins: "Administrateurs",
      permissions: "Gestion des permissions",
      "stripe-keys": "Clés Stripe",
      printers: "Imprimantes",
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
        <div className="bg-white shadow-sm border-b relative">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-3 relative z-[9999] bg-white hover:bg-gray-100 border shadow-sm"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 relative z-10">{getSectionTitle()}</h1>
            </div>
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
