
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Eye, Clock, Navigation, Printer } from "lucide-react";
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

  const printOrder = (order: Order) => {
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Impossible d\'ouvrir la fenêtre d\'impression');
      return;
    }

    // Générer le contenu HTML pour l'impression
    const printContent = generateOrderPrintContent(order);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const generateOrderPrintContent = (order: Order): string => {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const formatTime = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const getStatusLabel = (status: string) => {
      switch(status) {
        case 'pending': return 'En attente';
        case 'confirmed': return 'Confirmée';
        case 'preparing': return 'En préparation';
        case 'ready': return 'Prête';
        case 'out-for-delivery': return 'En livraison';
        case 'delivered': return 'Livrée';
        case 'completed': return 'Terminée';
        case 'cancelled': return 'Annulée';
        default: return status;
      }
    };

    const getOrderTypeLabel = (orderType: string) => {
      switch(orderType) {
        case 'delivery': return 'Livraison';
        case 'pickup': return 'À emporter';
        case 'dine-in': return 'Sur place';
        default: return orderType;
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Commande #${order.id.slice(-8)}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
            line-height: 1.4;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #d4af37;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .restaurant-name {
            font-size: 24px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 5px;
          }
          
          .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          
          .order-details {
            flex: 1;
          }
          
          .order-number {
            font-size: 18px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 10px;
          }
          
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .status.confirmed { background: #3b82f6; color: white; }
          .status.preparing { background: #f59e0b; color: white; }
          .status.ready { background: #10b981; color: white; }
          
          .client-info {
            margin-bottom: 20px;
            padding: 15px;
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            border-radius: 0 8px 8px 0;
          }
          
          .client-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .items-section {
            margin-bottom: 20px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #d4af37;
          }
          
          .item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .item:last-child {
            border-bottom: none;
          }
          
          .item-name {
            font-weight: 500;
            flex: 1;
          }
          
          .item-description {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
          }
          
          .item-price {
            font-weight: bold;
            color: #d4af37;
          }
          
          .total-section {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 2px solid #d4af37;
          }
          
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          
          .total-final {
            font-size: 18px;
            font-weight: bold;
            color: #d4af37;
            border-top: 2px solid #d4af37;
            padding-top: 10px;
            margin-top: 10px;
          }
          
          .notes {
            margin-top: 20px;
            padding: 15px;
            background: #fef3c7;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
          }
          
          .notes-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #92400e;
          }
          
          .delivery-info {
            margin-top: 15px;
            padding: 15px;
            background: #ecfdf5;
            border-radius: 8px;
            border-left: 4px solid #10b981;
          }
          
          .delivery-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #065f46;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
          
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">SUSHI EATS</div>
          <div>Commande de ${getOrderTypeLabel(order.orderType).toLowerCase()}</div>
        </div>
        
        <div class="order-info">
          <div class="order-details">
            <div class="order-number">Commande #${order.id.slice(-8)}</div>
            <div>Date: ${formatDate(order.createdAt)}</div>
            <div>Heure de livraison/retrait: ${formatTime(order.scheduledFor)}</div>
            <div>Type: ${getOrderTypeLabel(order.orderType)}</div>
          </div>
          <div>
            <span class="status ${order.status}">${getStatusLabel(order.status)}</span>
          </div>
        </div>
        
        <div class="client-info">
          <div class="client-name">${order.clientName || 'Client'}</div>
          <div>Téléphone: ${order.clientPhone || 'Non renseigné'}</div>
          ${order.clientEmail ? `<div>Email: ${order.clientEmail}</div>` : ''}
        </div>
        
        <div class="items-section">
          <div class="section-title">Articles commandés</div>
          ${order.items.map(item => `
            <div class="item">
              <div>
                <div class="item-name">${item.quantity}x ${item.menuItem.name}</div>
                ${item.menuItem.description ? `
                  <div class="item-description">
                    ${item.menuItem.description}
                  </div>
                ` : ''}
                ${item.specialInstructions ? `
                  <div class="item-description" style="color: #dc2626; font-weight: bold;">
                    ⚠️ Instructions spéciales: ${item.specialInstructions}
                  </div>
                ` : ''}
              </div>
              <div class="item-price">${(item.menuItem.price * item.quantity).toFixed(2)}€</div>
            </div>
          `).join('')}
        </div>
        
        <div class="total-section">
          <div class="total-line">
            <span>Sous-total:</span>
            <span>${order.subtotal.toFixed(2)}€</span>
          </div>
          <div class="total-line">
            <span>Taxes:</span>
            <span>${order.tax.toFixed(2)}€</span>
          </div>
          ${order.deliveryFee > 0 ? `
            <div class="total-line">
              <span>Frais de livraison:</span>
              <span>${order.deliveryFee.toFixed(2)}€</span>
            </div>
          ` : ''}
          ${order.tip && order.tip > 0 ? `
            <div class="total-line">
              <span>Pourboire:</span>
              <span>${order.tip.toFixed(2)}€</span>
            </div>
          ` : ''}
          ${order.discount && order.discount > 0 ? `
            <div class="total-line">
              <span>Remise:</span>
              <span>-${order.discount.toFixed(2)}€</span>
            </div>
          ` : ''}
          <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>${order.total.toFixed(2)}€</span>
          </div>
        </div>
        
        ${order.deliveryInstructions || order.customerNotes || order.allergies ? `
          <div class="notes">
            <div class="notes-title">Notes importantes:</div>
            ${order.deliveryInstructions ? `<div>📋 Instructions de livraison: ${order.deliveryInstructions}</div>` : ''}
            ${order.customerNotes ? `<div>💬 Notes du client: ${order.customerNotes}</div>` : ''}
            ${order.allergies && order.allergies.length > 0 ? `<div>⚠️ Allergies: ${order.allergies.join(', ')}</div>` : ''}
          </div>
        ` : ''}
        
        ${order.orderType === 'delivery' && (order.deliveryStreet || order.deliveryCity) ? `
          <div class="delivery-info">
            <div class="delivery-title">Adresse de livraison:</div>
            <div>${order.deliveryStreet || ''} ${order.deliveryCity || ''} ${order.deliveryPostalCode || ''}</div>
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Commande imprimée le ${formatDate(new Date())}</div>
          <div>Merci pour votre commande !</div>
        </div>
      </body>
      </html>
    `;
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
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => printOrder(order)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimer
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
