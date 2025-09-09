
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Eye, Clock, Navigation } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface OrdersDeliveryViewProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const OrdersDeliveryView = ({ 
  orders, 
  onViewDetails, 
  onUpdateStatus 
}: OrdersDeliveryViewProps) => {
  // Filtrer uniquement les commandes pertinentes pour la livraison
  const deliveryOrders = orders.filter(order => 
    (order.orderType === 'delivery' && 
     (order.status === 'out-for-delivery' || order.status === 'ready'))
  );

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ready':
        return <Badge className="bg-indigo-500">Prêt à livrer</Badge>;
      case 'out-for-delivery':
        return <Badge className="bg-orange-500">En livraison</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const openInMaps = (address: string, app: 'google' | 'apple' | 'waze') => {
    const encodedAddress = encodeURIComponent(address);
    let url = '';
    
    switch (app) {
      case 'google':
        url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        break;
      case 'apple':
        url = `maps://?q=${encodedAddress}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
        break;
    }
    
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Vue Livraison ({deliveryOrders.length})</h2>
      
      {deliveryOrders.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Pas de commandes à livrer pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveryOrders.map(order => (
            <Card key={order.id} className={`border-l-4 ${
              order.status === 'ready' ? 'border-l-indigo-500' : 'border-l-orange-500'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {order.clientName || `Commande #${order.id.substring(0, 6)}`}
                  </CardTitle>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{formatTime(order.scheduledFor)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium text-gray-700">Livraison</span>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              
              <CardContent className="py-2 space-y-2">
                {order.deliveryStreet && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                    <div className="flex-1">
                      <span className="text-sm">
                        {order.deliveryStreet}, {order.deliveryPostalCode} {order.deliveryCity}
                        {order.deliveryInstructions && (
                          <p className="text-xs text-gray-500 mt-1">{order.deliveryInstructions}</p>
                        )}
                      </span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-xs text-gold-600 flex items-center gap-1 mt-1"
                          >
                            <Navigation className="h-3 w-3" />
                            Naviguer
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem 
                            onClick={() => openInMaps(
                              `${order.deliveryStreet}, ${order.deliveryPostalCode} ${order.deliveryCity}`, 
                              'google'
                            )}
                          >
                            Google Maps
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openInMaps(
                              `${order.deliveryStreet}, ${order.deliveryPostalCode} ${order.deliveryCity}`, 
                              'apple'
                            )}
                          >
                            Apple Plans
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openInMaps(
                              `${order.deliveryStreet}, ${order.deliveryPostalCode} ${order.deliveryCity}`, 
                              'waze'
                            )}
                          >
                            Waze
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
                
                {order.clientPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <a 
                      href={`tel:${order.clientPhone}`} 
                      className="text-sm hover:underline text-gold-600"
                    >
                      {order.clientPhone}
                    </a>
                  </div>
                )}
                
                <div className="pt-2 border-t border-dashed">
                  <p className="text-sm font-medium">
                    {order.itemsSummary && order.itemsSummary.length > 0 
                      ? order.itemsSummary.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0)
                      : order.items.reduce((acc, item) => acc + item.quantity, 0)
                    } articles
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Détails
                </Button>
                
                {order.status === 'ready' && (
                  <Button
                    size="sm"
                    className="bg-gold-500 hover:bg-gold-600 text-black"
                    onClick={() => onUpdateStatus(order.id, 'out-for-delivery')}
                  >
                    En livraison
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
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersDeliveryView;
