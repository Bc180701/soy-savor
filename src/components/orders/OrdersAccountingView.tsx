
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Printer } from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const handleRecoverOrderItems = async (orderId: string) => {
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
  };

  const printOrder = async (order: Order) => {
    // Récupérer les détails complets de la commande comme dans OrderDetailsModal
    try {
      const { fetchOrderWithDetails } = await import('@/integrations/supabase/client');
      const orderDetails = await fetchOrderWithDetails(order.id);
      
      if (!orderDetails) {
        console.error('Impossible de récupérer les détails de la commande');
        return;
      }
      
      // Détecter iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // Sur iOS, ouvrir directement dans une nouvelle fenêtre avec le contenu
        const printContent = generateOrderPrintContent(orderDetails);
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
          console.error('Impossible d\'ouvrir la fenêtre d\'impression');
          return;
        }
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Sur iOS, laisser l'utilisateur utiliser le menu partage du navigateur
        printWindow.focus();
        
        // Optionnel: essayer d'ouvrir le menu d'impression après un délai
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

        const printContent = generateOrderPrintContent(orderDetails);
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé avant d'imprimer
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la commande:', error);
    }
  };

  const generateOrderPrintContent = (orderDetails: any): string => {
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
          <div>${getOrderTypeLabel(orderDetails.order_type)}</div>
        </div>
        
        <div class="order-info">
          <div class="order-number">#${orderDetails.id.slice(-8)}</div>
          <div>${formatTime(new Date(orderDetails.scheduled_for))} - ${orderDetails.client_name || 'Client'}</div>
          <div>Tel: ${orderDetails.client_phone || 'N/A'}</div>
        </div>
        
        <div class="items-section">
          <div class="section-title">ARTICLES</div>
          ${(() => {
            // Utiliser exactement la même logique que OrderDetailsModal
            if (orderDetails.order_items && orderDetails.order_items.length > 0) {
              return orderDetails.order_items.map((item: any, index: number) => {
                const itemName = item.name || `Produit ${item.id?.substring(0, 8) || 'inconnu'}`;
                const itemQuantity = item.quantity || 1;
                const itemPrice = item.price || 0;
                const specialInstructions = item.special_instructions || '';
                
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
            } else {
              return '<div class="item">Aucun article trouvé</div>';
            }
          })()}
        </div>
        
        <div class="total-section">
          <div class="total-line">
            <span>Sous-total:</span>
            <span>${orderDetails.subtotal.toFixed(2)}€</span>
          </div>
          <div class="total-line">
            <span>Taxes:</span>
            <span>${orderDetails.tax.toFixed(2)}€</span>
          </div>
          ${orderDetails.delivery_fee > 0 ? `
            <div class="total-line">
              <span>Livraison:</span>
              <span>${orderDetails.delivery_fee.toFixed(2)}€</span>
            </div>
          ` : ''}
          ${orderDetails.tip && orderDetails.tip > 0 ? `
            <div class="total-line">
              <span>Pourboire:</span>
              <span>${orderDetails.tip.toFixed(2)}€</span>
            </div>
          ` : ''}
          ${orderDetails.discount && orderDetails.discount > 0 ? `
            <div class="total-line">
              <span>Remise:</span>
              <span>-${orderDetails.discount.toFixed(2)}€</span>
            </div>
          ` : ''}
          <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>${orderDetails.total.toFixed(2)}€</span>
          </div>
        </div>
        
        ${orderDetails.delivery_instructions || orderDetails.customer_notes || orderDetails.allergies ? `
          <div class="notes">
            ${orderDetails.delivery_instructions ? `LIVRAISON: ${orderDetails.delivery_instructions}\n` : ''}
            ${orderDetails.customer_notes ? `NOTES: ${orderDetails.customer_notes}\n` : ''}
            ${orderDetails.allergies && orderDetails.allergies.length > 0 ? `ALLERGIES: ${orderDetails.allergies.join(', ')}\n` : ''}
          </div>
        ` : ''}
        
        ${orderDetails.order_type === 'delivery' && (orderDetails.delivery_street || orderDetails.delivery_city) ? `
          <div class="delivery-info">
            ADRESSE: ${orderDetails.delivery_street || ''} ${orderDetails.delivery_city || ''} ${orderDetails.delivery_postal_code || ''}
          </div>
        ` : ''}
        
        <div class="footer">
          ${new Date().toLocaleString('fr-FR')}
        </div>
      </body>
      </html>
    `;
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
                    <CardTitle className="text-sm">{order.clientName || 'Client'}</CardTitle>
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
                
                {/* Affichage des articles */}
                <div className="mb-2">
                  {order.itemsSummary && Array.isArray(order.itemsSummary) && order.itemsSummary.length > 0 ? (
                    <div className="space-y-1">
                      {order.itemsSummary.map((item: any, index: number) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          {item.quantity}x {item.name} - {item.price}€
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-600">
                      ⚠️ Aucun article affiché
                    </div>
                  )}
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
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => printOrder(order)}
                  >
                    <Printer className="h-3 w-3 mr-1" />
                    Imprimer
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                    onClick={() => handleRecoverOrderItems(order.id)}
                    title="Récupérer les order_items manquants"
                  >
                    🔄
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
              <TableHead className="p-2 text-left border">Commande</TableHead>
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
                <TableCell className="p-2 border">{order.clientName || 'Client'}</TableCell>
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
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => printOrder(order)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Printer className="h-4 w-4" />
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
