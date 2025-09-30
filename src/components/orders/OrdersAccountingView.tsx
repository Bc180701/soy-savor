
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
    try {
      console.log('🖨️ Impression Wi-Fi Direct - Commande:', order.id);
      
      // Préparer les données de la commande
      const orderData = {
        id: order.id,
        delivery_type: order.delivery_type,
        cartBackupItems: order.cartBackupItems || [],
        items: order.items || [],
        total: order.total,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address
      };
      
      // Obtenir l'URL du serveur d'impression depuis les variables d'environnement ou utiliser la valeur par défaut
      const printServerUrl = import.meta.env.VITE_PRINT_SERVER_URL || 'http://192.168.1.113:8080/print';
      
      // Utiliser HTTPS seulement si le serveur d'impression n'est pas une adresse IP locale
      const currentProtocol = window.location.protocol;
      const isLocalIP = printServerUrl.includes('192.168.') || 
                       printServerUrl.includes('127.0.0.1') || 
                       printServerUrl.includes('localhost');
      
      const printUrl = (currentProtocol === 'https:' && !isLocalIP)
        ? printServerUrl.replace('http:', 'https:') 
        : printServerUrl;
      
      console.log('🖨️ Utilisation de l\'URL du serveur d\'impression:', printUrl);
      
      // Envoyer à l'imprimante via Wi-Fi Direct
      const response = await fetch(printUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        alert(`✅ Commande #${order.id} envoyée à l'imprimante !\n\nL'impression va se lancer automatiquement.`);
      } else {
        alert(`❌ Erreur d'impression: ${result.message}`);
      }
      
    } catch (error) {
      console.error('Erreur impression:', error);
      alert(`❌ Erreur de connexion à l'imprimante.\n\nVérifiez que le serveur d'impression est démarré.`);
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
              
              let itemDescription = '';
              
              if (cartBackupItems && cartBackupItems.length > 0) {
                // Format CartBackupItem: { menuItem: { name, price, description }, quantity }
                itemName = item.menuItem?.name || `Produit ${item.menuItem?.id?.substring(0, 8) || 'inconnu'}`;
                itemQuantity = item.quantity || 1;
                itemPrice = item.menuItem?.price || 0;
                itemDescription = item.menuItem?.description || '';
                specialInstructions = item.specialInstructions || '';
              } else {
                // Format order_items ou items
                itemName = item.name || `Produit ${item.id?.substring(0, 8) || 'inconnu'}`;
                itemQuantity = item.quantity || 1;
                itemPrice = item.price || 0;
                itemDescription = item.description || '';
                specialInstructions = item.special_instructions || '';
              }
              
              // Détecter si c'est une création personnalisée (Poké Créa, Sushi Créa)
              const isCustomCreation = itemName.includes('Poké Créa') || itemName.includes('Sushi Créa');
              
              return `
                <div class="item">
                  <div class="item-line">
                    <span class="item-name">${itemQuantity}x ${itemName}</span>
                    <span class="item-price">${(itemQuantity * itemPrice).toFixed(2)}€</span>
                  </div>
                  ${isCustomCreation && itemDescription ? `
                    <div class="special-instructions">
                      ${itemDescription.replace(/\n/g, '<br>')}
                    </div>
                  ` : ''}
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
