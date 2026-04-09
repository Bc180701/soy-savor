import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { updateOrderStatus } from "@/services/orderService";
import { Order } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ChefHat, Truck, RefreshCw, CalendarHeart, Calendar } from "lucide-react";
import OrdersAccountingView from "./orders/OrdersAccountingView";
import OrdersKitchenView from "./orders/OrdersKitchenView";
import OrdersDeliveryView from "./orders/OrdersDeliveryView";
import OrdersEventView from "./orders/OrdersEventView";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { useSearchParams } from "react-router-dom";
import { useOptimizedOrders } from "@/hooks/useOptimizedOrders";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSpecialEvents } from "@/hooks/useSpecialEvents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderListProps {
  defaultTab?: string;
}

const OrderList: React.FC<OrderListProps> = ({ defaultTab = "accounting" }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeView, setActiveView] = useState<string>(defaultTab);
  const [daysBack, setDaysBack] = useState<number>(7);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { currentRestaurant, isLoading: restaurantLoading } = useRestaurantContext();
  
  // Récupérer les événements actifs
  const { activeEvents } = useSpecialEvents(currentRestaurant?.id);
  
  // Attendre que le contexte restaurant soit initialisé ET stable avant de charger les commandes
  // Ne jamais charger avec null (tous les restaurants) - attendre qu'un restaurant soit sélectionné
  const restaurantId = (restaurantLoading || !currentRestaurant) ? undefined : currentRestaurant.id;
  
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
    clearCache,
    isFromCache 
  } = useOptimizedOrders(restaurantId, daysBack);

  // Forcer un rafraîchissement au montage pour éviter les données mélangées
  const hasInitialRefresh = useRef(false);
  useEffect(() => {
    if (!hasInitialRefresh.current && restaurantId !== undefined) {
      hasInitialRefresh.current = true;
      clearCache();
      refreshOrders();
    }
  }, [restaurantId]);

  // Filtrer les commandes par événement actif (basé sur la date de l'événement)
  const eventOrdersMap = useMemo(() => {
    const map = new Map<string, { event: typeof activeEvents[0]; orders: Order[] }>();
    
    activeEvents.forEach(event => {
      // Filtrer les commandes dont scheduled_for correspond à la date de l'événement
      const eventDate = event.event_date; // Format YYYY-MM-DD
      
      const eventOrders = orders.filter(order => {
        const orderDate = new Date(order.scheduledFor);
        const orderDateStr = orderDate.toISOString().split('T')[0];
        return orderDateStr === eventDate;
      });
      
      if (eventOrders.length > 0 || event.is_active) {
        map.set(event.id, { event, orders: eventOrders });
      }
    });
    
    return map;
  }, [activeEvents, orders]);

  // Commandes normales (exclure les commandes d'événements)
  const regularOrders = useMemo(() => {
    const eventDates = new Set(activeEvents.map(e => e.event_date));
    
    return orders.filter(order => {
      const orderDate = new Date(order.scheduledFor);
      const orderDateStr = orderDate.toISOString().split('T')[0];
      return !eventDates.has(orderDateStr);
    });
  }, [orders, activeEvents]);

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

  const handleRecoverOrderItems = useCallback(async (orderId: string) => {
    try {
      console.log('🔄 Récupération order_items pour commande:', orderId);
      
      toast({
        title: "Récupération en cours...",
        description: "Tentative de récupération des articles manquants",
      });

      const { data, error } = await supabase.functions.invoke('recover-order-items', {
        body: { orderId }
      });

      if (error) {
        console.error('❌ Erreur récupération:', error);
        toast({
          title: "Erreur de récupération",
          description: `Impossible de récupérer les articles: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Résultat récupération:', data);
      
      if (data.success) {
        toast({
          title: "Récupération réussie",
          description: data.message,
        });
        // Actualiser les commandes pour voir les changements
        refreshOrders();
      } else {
        toast({
          title: "Récupération échouée",
          description: data.error || "Erreur inconnue",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('💥 Exception récupération order_items:', err);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors de la récupération",
        variant: "destructive",
      });
    }
  }, [toast, refreshOrders]);

  const handleViewDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
  }, []);

  // Convertir la map en tableau pour le rendu
  const activeEventsList = useMemo(() => 
    Array.from(eventOrdersMap.entries()).map(([id, data]) => ({
      id,
      ...data
    })),
    [eventOrdersMap]
  );

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={String(daysBack)} onValueChange={(v) => setDaysBack(Number(v))}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                  <SelectItem value="0">Tout l'historique</SelectItem>
                </SelectContent>
              </Select>
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
        </div>
      )}

      {isMobile && (
        <div className="flex items-center gap-2 px-2 py-2 border-b bg-background">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <Select value={String(daysBack)} onValueChange={(v) => setDaysBack(Number(v))}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">90 jours</SelectItem>
              <SelectItem value="0">Tout</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshOrders}
            disabled={loading}
            className="h-8 px-2 ml-auto"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
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
            className={`${isMobile ? 'w-full rounded-none border-b bg-white p-0 h-auto overflow-x-auto' : 'mb-6 w-full'}`}
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
            
            {/* Onglets dynamiques pour les événements actifs */}
            {activeEventsList.map(({ id, event, orders: eventOrders }) => (
              <TabsTrigger 
                key={id}
                variant={isMobile ? "horizontal" : "default"}
                value={`event-${id}`} 
                className={`flex items-center gap-2 ${isMobile ? 'flex-1 py-3 text-sm whitespace-nowrap' : ''}`}
              >
                <CalendarHeart className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                <span className={isMobile ? "text-xs" : ""}>
                  {event.name}
                  {eventOrders.length > 0 && (
                    <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                      {eventOrders.length}
                    </span>
                  )}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className={isMobile ? "p-0" : "p-6"}>
            <TabsContent value="accounting" className="mt-0">
              <OrdersAccountingView 
                orders={regularOrders} 
                onViewDetails={handleViewDetails} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </TabsContent>
            
            <TabsContent value="kitchen" className="mt-0">
              <OrdersKitchenView 
                orders={regularOrders} 
                onViewDetails={handleViewDetails} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </TabsContent>
            
            <TabsContent value="delivery" className="mt-0">
              <OrdersDeliveryView 
                orders={regularOrders} 
                onViewDetails={handleViewDetails} 
                onUpdateStatus={handleUpdateStatus} 
              />
            </TabsContent>
            
            {/* Contenus dynamiques pour les événements */}
            {activeEventsList.map(({ id, event, orders: eventOrders }) => (
              <TabsContent key={id} value={`event-${id}`} className="mt-0">
                <OrdersEventView
                  orders={eventOrders}
                  eventName={event.name}
                  onViewDetails={handleViewDetails}
                  onUpdateStatus={handleUpdateStatus}
                />
              </TabsContent>
            ))}
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
