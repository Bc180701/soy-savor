
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

  const printOrder = async (order: Order) => {
    // Détecter iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Récupérer les articles depuis cart_backup
    let cartBackupItems = [];
    if (order.clientEmail) {
      try {
        const { data, error } = await supabase
          .from('cart_backup')
          .select('cart_items')
          .eq('session_id', order.clientEmail)
          .eq('is_used', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data && data.cart_items) {
          cartBackupItems = data.cart_items;
          console.log('🔍 [PRINT] Articles récupérés depuis cart_backup:', cartBackupItems);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du cart_backup:', error);
      }
    }
    
    if (isIOS) {
      // Sur iOS, ouvrir directement dans une nouvelle fenêtre avec le contenu
      const printContent = generateOrderPrintContent(order, cartBackupItems);
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('Impossible d\'ouvrir la fenêtre d\'impression');
        return;
      }
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Sur iOS, laisser l'utilisateur utiliser le menu partage du navigateur
      printWindow.focus();
      
      // Essayer d'ouvrir le menu d'impression après un délai
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (error) {
          console.log('Impression automatique non supportée sur iOS, utilisez le menu partage');
        }
      }, 1000);
      
    } else {
      // Comportement normal pour les autres plateformes
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('Impossible d\'ouvrir la fenêtre d\'impression');
        return;
      }

      const printContent = generateOrderPrintContent(order, cartBackupItems);
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé avant d'imprimer
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const generateOrderPrintContent = (order: Order, cartBackupItems: any[] = []): string => {
    const formatTime = (date: Date) => {
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const getOrderTypeLabel = (orderType: string) => {
      switch(orderType) {
        case 'delivery': return 'LIVRAISON';
        case 'pickup': return 'EMPORTE';
        case 'dine-in': return 'SUR PLACE';
        default: return orderType;
      }
    };

    // Format optimisé pour imprimante thermique Epson TM-M30III-H
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Commande #${order.id.slice(-8)}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 5px;
            background: white;
            color: #000;
            line-height: 1.2;
            font-size: 12px;
            width: 80mm;
          }
          
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          
          .restaurant-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .order-info {
            margin-bottom: 8px;
            font-size: 11px;
          }
          
          .order-number {
            font-weight: bold;
            font-size: 13px;
          }
          
          .client-info {
            margin-bottom: 8px;
            font-size: 11px;
          }
          
          .client-name {
            font-weight: bold;
          }
          
          .items-section {
            margin-bottom: 8px;
          }
          
          .section-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 5px;
            font-size: 11px;
          }
          
          .item {
            margin-bottom: 3px;
            font-size: 11px;
          }
          
          .item-line {
            display: flex;
            justify-content: space-between;
          }
          
          .item-name {
            flex: 1;
          }
          
          .item-price {
            font-weight: bold;
          }
          
          .special-instructions {
            font-size: 10px;
            color: #000;
            margin-top: 2px;
            font-style: italic;
          }
          
          .total-section {
            margin-top: 8px;
            border-top: 1px solid #000;
            padding-top: 5px;
            font-size: 11px;
          }
          
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          
          .total-final {
            font-weight: bold;
            font-size: 12px;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin-top: 3px;
          }
          
          .notes {
            margin-top: 8px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 5px;
          }
          
          .delivery-info {
            margin-top: 5px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 3px;
          }
          
          .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #000;
            padding-top: 5px;
          }
          
          @media print {
            body { margin: 0; padding: 2px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">SUSHI EATS</div>
          <div>${getOrderTypeLabel(order.orderType)}</div>
        </div>
        
        <div class="order-info">
          <div class="order-number">#${order.id.slice(-8)}</div>
          <div>${formatTime(order.scheduledFor)} - ${order.clientName || 'Client'}</div>
          <div>Tel: ${order.clientPhone || 'N/A'}</div>
        </div>
        
        <div class="items-section">
          <div class="section-title">ARTICLES</div>
          ${(() => {
            // Utiliser cart_backup en priorité (comme OrderDetailsModal)
            let itemsToDisplay = [];
            
            if (cartBackupItems && cartBackupItems.length > 0) {
              // Format CartBackupItem (depuis cart_backup)
              itemsToDisplay = cartBackupItems;
              console.log('🔍 [PRINT] Utilisation cartBackupItems:', itemsToDisplay);
            } else if (order.itemsSummary && order.itemsSummary.length > 0) {
              // Format order_items (fallback)
              itemsToDisplay = order.itemsSummary;
            } else if (order.items && order.items.length > 0) {
              // Format items (fallback)
              itemsToDisplay = order.items;
            } else {
              return '<div class="item">Aucun article trouvé</div>';
            }
            
            return itemsToDisplay.map((item, index) => {
              let itemName, itemQuantity, itemPrice, specialInstructions;
              
              if (cartBackupItems && cartBackupItems.length > 0) {
                // Format CartBackupItem: { menuItem: { name, price }, quantity }
                itemName = item.menuItem?.name || `Produit ${item.menuItem?.id?.substring(0, 8) || 'inconnu'}`;
                itemQuantity = item.quantity || 1;
                itemPrice = item.menuItem?.price || 0;
                specialInstructions = item.specialInstructions || '';
              } else {
                // Format order_items ou items
                itemName = item.name || `Produit ${item.id?.substring(0, 8) || 'inconnu'}`;
                itemQuantity = item.quantity || 1;
                itemPrice = item.price || 0;
                specialInstructions = item.special_instructions || '';
              }
              
              return `
                <div class="item">
                  <div class="item-line">
                    <span class="item-name">${itemQuantity}x ${itemName}</span>
                    <span class="item-price">${(itemQuantity * itemPrice).toFixed(2)}€</span>
                  </div>
                  ${specialInstructions ? `
                    <div class="special-instructions">
                      * ${specialInstructions}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('');
          })()}
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
              <span>Livraison:</span>
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
            ${order.deliveryInstructions ? `LIVRAISON: ${order.deliveryInstructions}\n` : ''}
            ${order.customerNotes ? `NOTES: ${order.customerNotes}\n` : ''}
            ${order.allergies && order.allergies.length > 0 ? `ALLERGIES: ${order.allergies.join(', ')}\n` : ''}
          </div>
        ` : ''}
        
        ${order.orderType === 'delivery' && (order.deliveryStreet || order.deliveryCity) ? `
          <div class="delivery-info">
            ADRESSE: ${order.deliveryStreet || ''} ${order.deliveryCity || ''} ${order.deliveryPostalCode || ''}
          </div>
        ` : ''}
        
        <div class="footer">
          ${new Date().toLocaleString('fr-FR')}
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
                  onClick={() => {
                    printOrder(order).catch(error => {
                      console.error('Erreur impression:', error);
                    });
                  }}
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
