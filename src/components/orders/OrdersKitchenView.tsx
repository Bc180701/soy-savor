
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCustomProduct } from "@/utils/formatCustomProduct";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OrdersKitchenViewProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const OrdersKitchenView = ({ 
  orders, 
  onViewDetails, 
  onUpdateStatus 
}: OrdersKitchenViewProps) => {
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState("");
  const [isNotifying, setIsNotifying] = useState(false);
  const { toast } = useToast();
  
  // Filtrer uniquement les commandes pertinentes pour la cuisine
  // (commandes confirmées ou en préparation)
  const kitchenOrders = orders.filter(order => 
    order.status === 'confirmed' || 
    order.status === 'preparing'
  );

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <Badge className="bg-blue-500">À préparer</Badge>;
      case 'preparing':
        return <Badge className="bg-purple-500">En préparation</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDelayOrder = async () => {
    if (!selectedOrderId || !delayReason || isNotifying) return;

    setIsNotifying(true);

    try {
      const selectedOrder = orders.find(order => order.id === selectedOrderId);
      if (!selectedOrder) {
        throw new Error("Commande introuvable");
      }

      console.log("Envoi de la notification de retard pour la commande:", selectedOrderId);

      // Préparer le message commun (pour SMS éventuel)
      const delayMsg = `⏰ Retard de ${delayMinutes} min pour votre commande #${selectedOrderId.slice(0,8)}. Raison: ${delayReason}. Merci de votre compréhension.`;

      if (selectedOrder.clientEmail) {
        // Envoi par email via l'edge function dédiée
        const { data, error } = await supabase.functions.invoke('notify-order-delay', {
          body: {
            orderId: selectedOrderId,
            customerEmail: selectedOrder.clientEmail,
            customerName: selectedOrder.clientName || "Client",
            delayMinutes,
            delayReason,
            orderType: selectedOrder.orderType
          }
        });

        if (error) {
          console.error("Erreur lors de l'envoi de la notification email:", error);
          throw error;
        }
        console.log("Notification email de retard envoyée avec succès:", data);
      } else if (selectedOrder.clientPhone) {
        // Fallback invité: envoi par SMS si pas d'email
        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-notification', {
          body: {
            phoneNumber: selectedOrder.clientPhone,
            message: delayMsg,
            orderId: selectedOrderId,
          }
        });
        if (smsError) {
          console.error("Erreur lors de l'envoi du SMS de retard:", smsError);
          throw smsError;
        }
        console.log("SMS de retard envoyé:", smsData);

        // Aligner avec le comportement de l'email: consigner la note sur la commande
        const { error: updateErr } = await supabase
          .from('orders')
          .update({ customer_notes: `${delayReason} (Retard de ${delayMinutes} min signalé)` } as any)
          .eq('id', selectedOrderId);
        if (updateErr) console.warn("Impossible d'ajouter la note de retard sur la commande:", updateErr);
      } else {
        throw new Error("Aucun moyen de contact (email ou téléphone) n'est disponible pour cette commande");
      }

      toast({
        title: "Client notifié",
        description: `Le client a été informé d'un retard de ${delayMinutes} minutes.`,
        variant: "default",
      });

      setDelayDialogOpen(false);
      setDelayReason("");
      setSelectedOrderId(null);
    } catch (error: any) {
      console.error("Erreur lors de la notification de retard:", error);
      toast({
        title: "Erreur",
        description: `Impossible d'envoyer la notification de retard: ${error.message || "Erreur inconnue"}`,
        variant: "destructive",
      });
    } finally {
      setIsNotifying(false);
    }
  };

  const openDelayDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDelayDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Vue Cuisine ({kitchenOrders.length})</h2>
      
      {kitchenOrders.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Pas de commandes à préparer pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitchenOrders.map(order => (
            <Card key={order.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {order.clientName || `Commande #${order.id.substring(0, 6)}`}
                  </CardTitle>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      {order.orderType === 'delivery' ? 'Livraison: ' : 'Retrait: '}
                      {formatTime(order.scheduledFor)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium text-gray-700">
                    {order.orderType === 'delivery' ? 'Livraison' : 
                     order.orderType === 'pickup' ? 'À emporter' : 'Sur place'}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              
              <CardContent className="py-2">
                {/* Section produits commandés */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Produits commandés:</h4>
                  <ul className="space-y-3">
                    {order.itemsSummary && order.itemsSummary.length > 0 ? (
                      order.itemsSummary.map((item: any, index: number) => (
                        <li key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {item.quantity}× {item.name}
                            </span>
                          </div>
                          
                          {/* Afficher les détails des produits personnalisés */}
                          {formatCustomProduct(item.description)}
                          
                          {/* Afficher les instructions spéciales s'il y en a */}
                          {item.special_instructions && (
                            <div className="mt-1 text-xs italic text-gray-600">
                              Note: {item.special_instructions}
                            </div>
                          )}
                        </li>
                      ))
                    ) : (
                      order.items.map((item, index) => (
                        <li key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {item.quantity}× {item.menuItem.name}
                            </span>
                          </div>
                          
                          {/* Afficher les détails des produits personnalisés */}
                          {formatCustomProduct(item.menuItem.description)}
                          
                          {/* Afficher les instructions spéciales s'il y en a */}
                          {item.specialInstructions && (
                            <div className="mt-1 text-xs italic text-gray-600">
                              Note: {item.specialInstructions}
                            </div>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>


                {order.customerNotes && (
                  <div className="mt-3 p-2 bg-amber-50 rounded-md text-sm">
                    <span className="font-medium">Note:</span> {order.customerNotes}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-2 flex flex-wrap gap-2">
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
                  className="bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-800"
                  onClick={() => openDelayDialog(order.id)}
                  disabled={isNotifying}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Signaler retard
                </Button>
                
                {order.status === 'confirmed' && (
                  <Button
                    size="sm"
                    className="bg-gold-500 hover:bg-gold-600 text-black"
                    onClick={() => onUpdateStatus(order.id, 'preparing')}
                  >
                    Commencer préparation
                  </Button>
                )}
                
                {order.status === 'preparing' && (
                  <Button
                    size="sm"
                    className="bg-gold-500 hover:bg-gold-600 text-black"
                    onClick={() => onUpdateStatus(order.id, order.orderType === 'delivery' ? 'out-for-delivery' : 'ready')}
                  >
                    {order.orderType === 'delivery' ? 'Prêt pour livraison' : 'Prêt à emporter'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Dialogue de retard */}
      <Dialog open={delayDialogOpen} onOpenChange={setDelayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler un retard</DialogTitle>
            <DialogDescription>
              Informez le client que sa commande sera retardée. Un message sera envoyé (email ou SMS).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium flex-shrink-0 w-24">Retard estimé:</label>
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDelayMinutes(Math.max(5, delayMinutes - 5))}
                  className="mr-2"
                  disabled={isNotifying}
                >
                  -
                </Button>
                <span className="w-16 text-center">{delayMinutes} min</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDelayMinutes(delayMinutes + 5)}
                  className="ml-2"
                  disabled={isNotifying}
                >
                  +
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Raison du retard:</label>
              <Input
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="Ex: Volume important de commandes..."
                required
                disabled={isNotifying}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDelayDialogOpen(false)}
              disabled={isNotifying}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDelayOrder}
              disabled={!delayReason || isNotifying}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isNotifying ? "Envoi en cours..." : "Notifier le client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersKitchenView;
