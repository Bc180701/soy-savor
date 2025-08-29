import React, { useState, useCallback, useRef } from "react";
import { updateOrderStatus } from "@/services/orderService";
import { Order } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ChefHat, Truck, RefreshCw } from "lucide-react";
import OrdersAccountingView from "./orders/OrdersAccountingView";
import OrdersKitchenView from "./orders/OrdersKitchenView";
import OrdersDeliveryView from "./orders/OrdersDeliveryView";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { useSearchParams } from "react-router-dom";
import { useOptimizedOrders } from "@/hooks/useOptimizedOrders";
import { Button } from "@/components/ui/button";

interface OrderListProps {
  defaultTab?: string;
}

const OrderList: React.FC<OrderListProps> = ({ defaultTab = "accounting" }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeView, setActiveView] = useState<string>(defaultTab);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { currentRestaurant, isLoading: restaurantLoading } = useRestaurantContext();
  
  // Attendre que le contexte restaurant soit initialisé ET stable avant de charger les commandes
  const restaurantId = restaurantLoading ? undefined : (currentRestaurant?.id || null);
  
  // Suivre les changements de restaurant pour déboguer
  const prevRestaurantId = useRef<string | null | undefined>(undefined);
  if (prevRestaurantId.current !== restaurantId) {
    console.log('🔄 [OrderList] Changement de restaurant:', {
      ancien: prevRestaurantId.current,
      nouveau: restaurantId,
      isLoading: restaurantLoading
    });
    prevRestaurantId.current = restaurantId;
  }
  
  // Utiliser le hook optimisé pour les commandes
  const { 
    orders, 
    loading, 
    error, 
    refreshOrders, 
    updateOrderLocally, 
    isFromCache 
  } = useOptimizedOrders(restaurantId);

  // Fonction pour mettre à jour l'onglet dans l'URL
  const handleTabChange = useCallback((newTab: string) => {
    setActiveView(newTab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", newTab);
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: string) => {
    try {
      console.log(`📝 Mise à jour statut commande ${orderId} -> ${newStatus}`);
      
      // Mise à jour optimiste de l'interface
      updateOrderLocally(orderId, { status: newStatus as any });
      
      const { success, error } = await updateOrderStatus(orderId, newStatus);
      
      if (success) {
        toast({
          title: "Statut mis à jour",
          description: "Le statut de la commande a été mis à jour et le client a été notifié.",
        });
      } else {
        console.error("❌ Erreur mise à jour statut:", error);
        
        // Annuler la mise à jour optimiste en cas d'erreur
        const originalOrder = orders.find(o => o.id === orderId);
        if (originalOrder) {
          updateOrderLocally(orderId, { status: originalOrder.status });
        }
        
        toast({
          title: "Erreur",
          description: `Impossible de mettre à jour le statut: ${error}`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("💥 Exception mise à jour statut:", err);
      
      // Annuler la mise à jour optimiste
      const originalOrder = orders.find(o => o.id === orderId);
      if (originalOrder) {
        updateOrderLocally(orderId, { status: originalOrder.status });
      }
      
      toast({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  }, [updateOrderLocally, orders, toast]);

  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  return (
    <div className={`${isMobile ? 'w-full px-2' : 'bg-white rounded-lg shadow-md'} overflow-hidden`}>
      {!isMobile && (
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">
              Gestion des Commandes {currentRestaurant?.name && `- ${currentRestaurant.name}`}
            </h2>
            {isFromCache && (
              <p className="text-sm text-muted-foreground">
                📦 Données en cache - {orders.length} commandes
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive">
                ⚠️ {error}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshOrders}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      )}
      
      {(loading || restaurantLoading) ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">
            {restaurantLoading ? 'Initialisation...' : 'Chargement des commandes...'}
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-destructive mb-4">⚠️ {error}</p>
          <Button onClick={refreshOrders} variant="outline">
            Réessayer
          </Button>
        </div>
      ) : (
        <Tabs value={activeView} onValueChange={handleTabChange} className="w-full">
          <TabsList 
            variant={isMobile ? "horizontal" : "default"} 
            className={`${isMobile ? 'w-full rounded-none border-b bg-white p-0 h-auto' : 'mb-6 w-full'}`}
          >
            <TabsTrigger 
              variant={isMobile ? "horizontal" : "default"}
              value="accounting" 
              className={`flex items-center gap-2 ${isMobile ? 'flex-1 py-3 text-sm' : ''}`}
            >
              <FileText className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              <span className={isMobile ? "text-xs" : ""}>Comptable</span>
            </TabsTrigger>
            <TabsTrigger 
              variant={isMobile ? "horizontal" : "default"}
              value="kitchen" 
              className={`flex items-center gap-2 ${isMobile ? 'flex-1 py-3 text-sm' : ''}`}
            >
              <ChefHat className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              <span className={isMobile ? "text-xs" : ""}>Cuisine</span>
            </TabsTrigger>
            <TabsTrigger 
              variant={isMobile ? "horizontal" : "default"}
              value="delivery" 
              className={`flex items-center gap-2 ${isMobile ? 'flex-1 py-3 text-sm' : ''}`}
            >
              <Truck className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              <span className={isMobile ? "text-xs" : ""}>Livraison</span>
            </TabsTrigger>
          </TabsList>
          
          <div className={isMobile ? "p-0" : "p-6"}>
            <TabsContent value="accounting" className="mt-0">
              <OrdersAccountingView 
                orders={orders} 
                onViewDetails={handleViewDetails} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </TabsContent>
            
            <TabsContent value="kitchen" className="mt-0">
              <OrdersKitchenView 
                orders={orders} 
                onViewDetails={handleViewDetails} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </TabsContent>
            
            <TabsContent value="delivery" className="mt-0">
              <OrdersDeliveryView 
                orders={orders} 
                onViewDetails={handleViewDetails} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </TabsContent>
          </div>
        </Tabs>
      )}
      
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderList;
