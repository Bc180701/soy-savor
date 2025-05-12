
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrdersAccountingViewProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const OrdersAccountingView = ({ 
  orders, 
  onViewDetails, 
  onUpdateStatus 
}: OrdersAccountingViewProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Vue Comptable ({orders.length})</h2>
      
      {orders.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Aucune commande trouvée.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="p-2 text-left border">ID</TableHead>
                <TableHead className="p-2 text-left border">Date</TableHead>
                <TableHead className="p-2 text-left border">Type</TableHead>
                <TableHead className="p-2 text-left border">Total</TableHead>
                <TableHead className="p-2 text-left border">Statut</TableHead>
                <TableHead className="p-2 text-left border">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="border-b hover:bg-gray-50">
                  <TableCell className="p-2 border">{order.id.substring(0, 8)}...</TableCell>
                  <TableCell className="p-2 border">{formatDate(order.scheduledFor)}</TableCell>
                  <TableCell className="p-2 border">
                    {order.orderType === 'delivery' ? 'Livraison' : 
                     order.orderType === 'pickup' ? 'À emporter' : 'Sur place'}
                  </TableCell>
                  <TableCell className="p-2 border">{order.total.toFixed(2)} €</TableCell>
                  <TableCell className="p-2 border">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="p-2 border flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-gold-500 hover:bg-gold-600 text-black"
                        onClick={() => onUpdateStatus(order.id, 'confirmed')}
                      >
                        Confirmer
                      </Button>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        className="bg-gold-500 hover:bg-gold-600 text-black"
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                      >
                        Préparer
                      </Button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        className="bg-gold-500 hover:bg-gold-600 text-black"
                        onClick={() => onUpdateStatus(order.id, order.orderType === 'delivery' ? 'out-for-delivery' : 'ready')}
                      >
                        {order.orderType === 'delivery' ? 'Envoyer en livraison' : 'Prêt'}
                      </Button>
                    )}
                    
                    {order.status === 'out-for-delivery' && (
                      <Button
                        size="sm"
                        className="bg-gold-500 hover:bg-gold-600 text-black"
                        onClick={() => onUpdateStatus(order.id, 'delivered')}
                      >
                        Livré
                      </Button>
                    )}
                    
                    {(order.status === 'ready' || order.status === 'delivered') && (
                      <Button
                        size="sm"
                        className="bg-gold-500 hover:bg-gold-600 text-black"
                        onClick={() => onUpdateStatus(order.id, 'completed')}
                      >
                        Terminer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default OrdersAccountingView;
