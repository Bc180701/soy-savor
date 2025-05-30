import { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus } from "@/services/orderService";
import { Order } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ChefHat, Truck } from "lucide-react";
import OrdersAccountingView from "./orders/OrdersAccountingView";
import OrdersKitchenView from "./orders/OrdersKitchenView";
import OrdersDeliveryView from "./orders/OrdersDeliveryView";
import { useIsMobile } from "@/hooks/use-mobile";

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeView, setActiveView] = useState<string>("accounting");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        console.log("Récupération des commandes...");
        const { orders: fetchedOrders, error } = await getAllOrders();
        
        if (error) {
          console.error("Erreur lors de la récupération des commandes:", error);
          toast({
            title: "Erreur",
            description: `Impossible de charger les commandes: ${error.message || error}`,
            variant: "destructive",
          });
        } else {
          console.log(`${fetchedOrders?.length || 0} commandes récupérées:`, fetchedOrders);
          setOrders(fetchedOrders || []);
        }
      } catch (err) {
        console.error("Exception lors de la récupération des commandes:", err);
        toast({
          title: "Erreur inattendue",
          description: "Une erreur est survenue lors du chargement des commandes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [toast]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      console.log(`Mise à jour du statut de la commande ${orderId} à ${newStatus}`);
      const { success, error } = await updateOrderStatus(orderId, newStatus);
      
      if (success) {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as any } 
            : order
        ));
        
        toast({
          title: "Statut mis à jour",
          description: "Le statut de la commande a été mis à jour et le client a été notifié.",
          variant: "success",
        });
      } else {
        console.error("Erreur lors de la mise à jour du statut:", error);
        toast({
          title: "Erreur",
          description: `Impossible de mettre à jour le statut: ${error}`,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Exception lors de la mise à jour du statut:", err);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  return (
    <div className={`${isMobile ? 'w-screen -ml-6 -mr-6' : 'bg-white rounded-lg shadow-md'} overflow-hidden`}>
      {!isMobile && (
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Gestion des Commandes</h2>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
        </div>
      ) : (
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
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
          
          <div className={isMobile ? "px-1" : "p-6"}>
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
