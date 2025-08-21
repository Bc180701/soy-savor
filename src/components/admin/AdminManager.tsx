import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Menu, RotateCcw } from "lucide-react";
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

import StripeKeysManager from "./StripeKeysManager";
import PrintersManager from "./PrintersManager";
import BlockedTimeSlotsManager from "./BlockedTimeSlotsManager";
import AdminSidebar from "./AdminSidebar";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import TestOrderNotification from "./TestOrderNotification";
import DeliveryPhoneManager from "./DeliveryPhoneManager";
import { BluetoothManager } from "./BluetoothManager";

const AdminManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const { currentRestaurant } = useRestaurantContext();
  
  // Get active section from URL params or default to dashboard
  const activeSection = searchParams.get("section") || "dashboard";
  
  // Enable order notifications for admins
  const { hasNewOrders, audioEnabled, enableAudio, clearNotifications } = useOrderNotifications(true, currentRestaurant?.id);

  // Auto-refresh for orders section every 3 minutes
  useEffect(() => {
    if (!autoRefresh || activeSection !== "orders") return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      window.location.reload();
    }, 180000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeSection]);

  // Clear notifications when page is focused
  useEffect(() => {
    const handleFocus = () => {
      clearNotifications();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [clearNotifications]);

  const handleSectionChange = (section: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("section", section);
    setSearchParams(newParams);
  };

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    window.location.reload();
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardStats />;
      case "orders":
        return <OrderList defaultTab={searchParams.get("tab") || "kitchen"} />;
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
      case "stripe-keys":
        return <StripeKeysManager />;
      case "printers":
        return <PrintersManager />;
      case "bluetooth":
        return <BluetoothManager />;
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
      "stripe-keys": "Clés Stripe",
      printers: "Imprimantes",
      bluetooth: "Bluetooth Mobile",
      settings: "Paramètres"
    };
    return titles[activeSection as keyof typeof titles] || "Administration";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center relative gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-3 relative z-[9999] bg-white hover:bg-gray-100 border shadow-sm"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 relative z-10">
                {getSectionTitle()}
                {activeSection === "orders" && hasNewOrders && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                    Nouvelles commandes !
                  </span>
                )}
              </h1>
              {currentRestaurant && (
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {currentRestaurant.name}
                </span>
              )}
            </div>
            
            {activeSection === "orders" && (
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
                {!audioEnabled && (
                  <Button 
                    onClick={enableAudio}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    Activer le son
                  </Button>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Dernière mise à jour: {lastRefresh.toLocaleTimeString()}</span>
                  <Button
                    onClick={handleManualRefresh}
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Auto-actualisation:</label>
                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    variant={autoRefresh ? "default" : "outline"}
                    size="sm"
                  >
                    {autoRefresh ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>
            )}
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
