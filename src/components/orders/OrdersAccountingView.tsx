
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
import { formatEuro } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const isMobile = useIsMobile();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDateMobile = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-xs">En attente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500 text-xs">Confirmée</Badge>;
      case 'preparing':
        return <Badge className="bg-purple-500 text-xs">En préparation</Badge>;
      case 'ready':
        return <Badge className="bg-indigo-500 text-xs">Prête</Badge>;
      case 'out-for-delivery':
        return <Badge className="bg-orange-500 text-xs">En livraison</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500 text-xs">Livrée</Badge>;
      case 'completed':
        return <Badge className="bg-green-700 text-xs">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-xs">Annulée</Badge>;
      default:
        return <Badge className="text-xs">{status}</Badge>;
    }
  };

  const getClientTypeLabel = (order: Order) => {
    if (!order.userId) {
      return "Invité";
    }
    return "Client";
  };

  const getActionButton = (order: Order) => {
    if (order.status === 'pending') {
      return (
        <Button
          size="sm"
          className="bg-gold-500 hover:bg-gold-600 text-black text-xs"
          onClick={() => onUpdateStatus(order.id, 'confirmed')}
        >
          Confirmer
        </Button>
      );
    }
    
    if (order.status === 'confirmed') {
      return (
        <Button
          size="sm"
          className="bg-gold-500 hover:bg-gold-600 text-black text-xs"
          onClick={() => onUpdateStatus(order.id, 'preparing')}
        >
          Préparer
        </Button>
      );
    }
    
    if (order.status === 'preparing') {
      return (
        <Button
          size="sm"
          className="bg-gold-500 hover:bg-gold-600 text-black text-xs"
          onClick={() => onUpdateStatus(order.id, order.orderType === 'delivery' ? 'out-for-delivery' : 'ready')}
        >
          {order.orderType === 'delivery' ? 'Livraison' : 'Prêt'}
        </Button>
      );
    }
    
    if (order.status === 'out-for-delivery') {
      return (
        <Button
          size="sm"
          className="bg-gold-500 hover:bg-gold-600 text-black text-xs"
          onClick={() => onUpdateStatus(order.id, 'delivered')}
        >
          Livré
        </Button>
      );
    }
    
    if (order.status === 'ready' || order.status === 'delivered') {
      return (
        <Button
          size="sm"
          className="bg-gold-500 hover:bg-gold-600 text-black text-xs"
          onClick={() => onUpdateStatus(order.id, 'completed')}
        >
          Terminer
        </Button>
      );
    }
    
    return null;
  };

  if (orders.length === 0) {
    return (
      <div className={isMobile ? "" : ""}>
        <h2 className="text-2xl font-bold mb-4">Vue Comptable (0)</h2>
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Aucune commande trouvée.</p>
          <p className="text-gray-500 mt-2">Les commandes apparaîtront ici une fois qu'elles seront créées et payées.</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-bold mb-3">Vue Comptable ({orders.length})</h2>
        
        <div className="space-y-2">
          {orders.map((order) => (
            <Card key={order.id} className="border">
              <CardHeader className="pb-2 px-3 py-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">#{order.id.substring(0, 6)}</CardTitle>
                    <p className="text-xs text-gray-500">{formatDateMobile(order.scheduledFor)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatEuro(order.total)}</div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 px-3 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600">
                    {order.orderType === 'delivery' ? 'Livraison' : 
                     order.orderType === 'pickup' ? 'À emporter' : 'Sur place'} • {getClientTypeLabel(order)}
                  </span>
                </div>
                
                <div className="flex gap-2 justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs flex-1"
                    onClick={() => onViewDetails(order)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Voir
                  </Button>
                  
                  {getActionButton(order) && (
                    <div className="flex-1">
                      {getActionButton(order)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Vue Comptable ({orders.length})</h2>
      
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="p-2 text-left border">ID</TableHead>
              <TableHead className="p-2 text-left border">Date</TableHead>
              <TableHead className="p-2 text-left border">Type</TableHead>
              <TableHead className="p-2 text-left border">Client</TableHead>
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
                <TableCell className="p-2 border">{getClientTypeLabel(order)}</TableCell>
                <TableCell className="p-2 border">{formatEuro(order.total)}</TableCell>
                <TableCell className="p-2 border">{getStatusBadge(order.status)}</TableCell>
                <TableCell className="p-2 border flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewDetails(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {getActionButton(order)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrdersAccountingView;
