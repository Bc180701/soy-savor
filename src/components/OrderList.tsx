
import { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus } from "@/services/orderService";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Eye } from "lucide-react";
import OrderDetailsModal from "@/components/OrderDetailsModal";

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500">Confirmée</Badge>;
      case 'preparing':
        return <Badge className="bg-purple-500">En préparation</Badge>;
      case 'ready':
        return <Badge className="bg-indigo-500">Prête</Badge>;
      case 'out-for-delivery':
        return <Badge className="bg-orange-500">En livraison</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">Livrée</Badge>;
      case 'completed':
        return <Badge className="bg-green-700">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Gestion des Commandes</h2>
      
      {loading ? (
        <p className="text-center py-4">Chargement des commandes...</p>
      ) : orders.length === 0 ? (
        <p className="text-center py-4">Aucune commande trouvée.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left border">ID</th>
                <th className="p-2 text-left border">Date</th>
                <th className="p-2 text-left border">Type</th>
                <th className="p-2 text-left border">Total</th>
                <th className="p-2 text-left border">Statut</th>
                <th className="p-2 text-left border">Paiement</th>
                <th className="p-2 text-left border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 border">{order.id.substring(0, 8)}...</td>
                  <td className="p-2 border">{formatDate(order.createdAt)}</td>
                  <td className="p-2 border">
                    {order.orderType === 'delivery' ? 'Livraison' : 
                     order.orderType === 'pickup' ? 'À emporter' : 'Sur place'}
                  </td>
                  <td className="p-2 border">{order.total.toFixed(2)} €</td>
                  <td className="p-2 border">{getStatusBadge(order.status)}</td>
                  <td className="p-2 border">
                    {order.paymentStatus === 'paid' ? (
                      <Badge className="bg-green-500">Payé</Badge>
                    ) : order.paymentStatus === 'pending' ? (
                      <Badge className="bg-yellow-500">En attente</Badge>
                    ) : (
                      <Badge variant="destructive">Échoué</Badge>
                    )}
                  </td>
                  <td className="p-2 border flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                      >
                        Confirmer
                      </Button>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      >
                        Préparer
                      </Button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, order.orderType === 'delivery' ? 'out-for-delivery' : 'ready')}
                      >
                        {order.orderType === 'delivery' ? 'Envoyer en livraison' : 'Prêt'}
                      </Button>
                    )}
                    
                    {order.status === 'out-for-delivery' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      >
                        Livré
                      </Button>
                    )}
                    
                    {(order.status === 'ready' || order.status === 'delivered') && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                      >
                        Terminer
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
