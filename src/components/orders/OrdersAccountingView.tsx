
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
