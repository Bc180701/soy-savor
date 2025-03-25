
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Clock, MapPin, Mail, User, Phone, CreditCard, AlertCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types";

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderDetailsModal = ({ order, open, onOpenChange }: OrderDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [addressDetails, setAddressDetails] = useState<any | null>(null);

  useEffect(() => {
    if (order && open) {
      fetchOrderDetails(order.id);
    }
  }, [order, open]);

  const fetchOrderDetails = async (orderId: string) => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      // Récupérer les détails de la commande et les articles
      const { data: fetchedOrder, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      
      setOrderDetails(fetchedOrder);

      // Récupérer les détails du produit pour chaque article
      const orderWithProducts = { ...fetchedOrder };
      if (fetchedOrder.order_items && fetchedOrder.order_items.length > 0) {
        const productIds = fetchedOrder.order_items.map((item: any) => item.product_id);
        
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
          
        if (productsError) throw productsError;
        
        // Associer les produits aux articles de commande
        orderWithProducts.order_items = fetchedOrder.order_items.map((item: any) => {
          const product = products.find((p: any) => p.id === item.product_id);
          return { ...item, product };
        });
        
        setOrderDetails(orderWithProducts);
      }

      // Récupérer les informations du client
      if (fetchedOrder.user_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', fetchedOrder.user_id)
          .single();
          
        if (!profileError) {
          setCustomerDetails(profile);
        }
        
        // Récupérer l'adresse de livraison si disponible
        if (fetchedOrder.delivery_address_id) {
          const { data: address, error: addressError } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('id', fetchedOrder.delivery_address_id)
            .single();
            
          if (!addressError) {
            setAddressDetails(address);
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la commande:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', { 
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return "default";
      case 'confirmed': return "secondary";
      case 'preparing': return "outline";
      case 'ready': return "secondary";
      case 'out-for-delivery': return "outline";
      case 'delivered': return "success";
      case 'completed': return "success";
      case 'cancelled': return "destructive";
      default: return "default";
    }
  };

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'preparing': 'En préparation',
      'ready': 'Prête',
      'out-for-delivery': 'En livraison',
      'delivered': 'Livrée',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    
    return statusMap[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Détails de la commande #{orderDetails?.id?.substring(0, 8)}
          </DialogTitle>
          <DialogDescription>
            {orderDetails && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusBadgeVariant(orderDetails.status)}>
                  {translateStatus(orderDetails.status)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Créée le {formatDate(orderDetails.created_at)}
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : orderDetails ? (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Informations client */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Informations client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {customerDetails?.first_name} {customerDetails?.last_name || 'Non renseigné'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customerDetails?.email || 'Email non disponible'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customerDetails?.phone || 'Téléphone non renseigné'}</span>
                  </div>
                  {orderDetails.contact_preference && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>Préférence de contact: {orderDetails.contact_preference}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Informations supplémentaires */}
              {(orderDetails.allergies || orderDetails.customer_notes) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Informations supplémentaires</h3>
                  {orderDetails.allergies && orderDetails.allergies.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Allergies:</div>
                        <div className="text-sm">
                          {orderDetails.allergies.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {orderDetails.customer_notes && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Notes du client:</div>
                        <div className="text-sm italic">"{orderDetails.customer_notes}"</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Informations de livraison */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Informations de livraison</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {orderDetails.order_type === 'pickup' && orderDetails.pickup_time 
                        ? `À emporter à: ${orderDetails.pickup_time}`
                        : `Livraison prévue: ${formatDate(orderDetails.scheduled_for)}`}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {addressDetails ? (
                        <>
                          <div>{addressDetails.street}</div>
                          <div>{addressDetails.postal_code} {addressDetails.city}</div>
                          {addressDetails.additional_info && (
                            <div className="text-sm text-muted-foreground">{addressDetails.additional_info}</div>
                          )}
                        </>
                      ) : (
                        <span>
                          {orderDetails.order_type === 'delivery' 
                            ? 'Adresse de livraison non disponible' 
                            : orderDetails.order_type === 'pickup' 
                              ? 'À emporter' 
                              : 'Sur place'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {orderDetails.delivery_instructions && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-4"></div>
                      <div className="italic text-muted-foreground">
                        "Instructions de livraison: {orderDetails.delivery_instructions}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Informations de paiement */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Informations de paiement</h3>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="capitalize">
                      {orderDetails.payment_method === 'credit-card' 
                        ? 'Carte bancaire' 
                        : orderDetails.payment_method === 'cash' 
                          ? 'Espèces'
                          : orderDetails.payment_method}
                    </span>
                    <Badge 
                      variant={orderDetails.payment_status === 'paid' ? 'success' : 'outline'}
                      className="ml-2"
                    >
                      {orderDetails.payment_status === 'paid' ? 'Payé' : 
                        orderDetails.payment_status === 'pending' ? 'En attente' : 'Échoué'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Produits commandés */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Produits commandés</h3>
                <div className="border rounded-md divide-y">
                  {orderDetails.order_items && orderDetails.order_items.length > 0 ? (
                    orderDetails.order_items.map((item: any) => (
                      <div key={item.id} className="p-3 flex justify-between">
                        <div>
                          <div className="font-medium">
                            {item.product?.name || `Produit ${item.product_id.substring(0, 8)}`}
                          </div>
                          {item.special_instructions && (
                            <div className="text-sm text-muted-foreground italic">
                              "{item.special_instructions}"
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div>{item.quantity} x {item.price.toFixed(2)} €</div>
                          <div className="font-semibold">
                            {(item.quantity * item.price).toFixed(2)} €
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">
                      Aucun produit trouvé
                    </div>
                  )}
                </div>
              </div>
              
              {/* Récapitulatif des prix */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{orderDetails.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA</span>
                  <span>{orderDetails.tax.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de livraison</span>
                  <span>{orderDetails.delivery_fee.toFixed(2)} €</span>
                </div>
                {orderDetails.tip > 0 && (
                  <div className="flex justify-between">
                    <span>Pourboire</span>
                    <span>{orderDetails.tip.toFixed(2)} €</span>
                  </div>
                )}
                {orderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Remise {orderDetails.promo_code && `(${orderDetails.promo_code})`}</span>
                    <span>-{orderDetails.discount.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{orderDetails.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Impossible de récupérer les détails de la commande
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
