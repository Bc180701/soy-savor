
import { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus } from "@/services/orderService";
import { Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ChefHat, Truck } from "lucide-react";
import OrdersAccountingView from "./orders/OrdersAccountingView";
import OrdersKitchenView from "./orders/OrdersKitchenView";
import OrdersDeliveryView from "./orders/OrdersDeliveryView";

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeView, setActiveView] = useState<string>("accounting");
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { orders, error } = await getAllOrders();
      if (error) {
        toast({
          title: "Erreur",
          description: `Impossible de charger les commandes: ${error}`,
          variant: "destructive",
        });
      } else {
        setOrders(orders);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [toast]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { success, error } = await updateOrderStatus(orderId, newStatus);
    
    if (success) {
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any } 
          : order
      ));
      
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été mis à jour avec succès.",
      });
    } else {
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le statut: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Gestion des Commandes</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
        </div>
      ) : (
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="mb-6 grid grid-cols-3 w-full">
            <TabsTrigger value="accounting" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Comptable</span>
            </TabsTrigger>
            <TabsTrigger value="kitchen" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span>Cuisine</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>Livraison</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="accounting">
            <OrdersAccountingView 
              orders={orders} 
              onViewDetails={handleViewDetails} 
              onUpdateStatus={handleUpdateStatus} 
            />
          </TabsContent>
          
          <TabsContent value="kitchen">
            <OrdersKitchenView 
              orders={orders} 
              onViewDetails={handleViewDetails} 
              onUpdateStatus={handleUpdateStatus} 
            />
          </TabsContent>
          
          <TabsContent value="delivery">
            <OrdersDeliveryView 
              orders={orders} 
              onViewDetails={handleViewDetails} 
              onUpdateStatus={handleUpdateStatus} 
            />
          </TabsContent>
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
