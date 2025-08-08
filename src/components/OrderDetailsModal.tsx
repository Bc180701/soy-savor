
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
import { fetchOrderWithDetails } from "@/integrations/supabase/client";
import { ClipboardList, Clock, MapPin, Mail, User, Phone, CreditCard, AlertCircle, MessageSquare, Calendar, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MissingItemsAlert } from "@/components/admin/MissingItemsAlert";

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
      const completeOrderDetails = await fetchOrderWithDetails(orderId);
      
      if (completeOrderDetails) {
        setOrderDetails(completeOrderDetails);
        setCustomerDetails(completeOrderDetails.customer);
        setAddressDetails(completeOrderDetails.delivery_address);
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

  const translatePaymentMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      'credit-card': 'Carte bancaire',
      'cash': 'Espèces',
      'paypal': 'PayPal'
    };
    
    return methodMap[method] || method;
  };

  const translatePaymentStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'paid': 'Payé',
      'pending': 'En attente',
      'failed': 'Échoué'
    };
    
    return statusMap[status] || status;
  };

  const translateOrderType = (type: string) => {
    const typeMap: Record<string, string> = {
      'delivery': 'Livraison',
      'pickup': 'À emporter',
      'dine-in': 'Sur place'
    };
    
    return typeMap[type] || type;
  };

  const getClientName = () => {
    // Priorité aux nouvelles informations client
    if (orderDetails?.client_name) return orderDetails.client_name;
    if (customerDetails?.first_name && customerDetails?.last_name) {
      return `${customerDetails.first_name} ${customerDetails.last_name}`;
    }
    return 'Non renseigné';
  };

  const getClientPhone = () => {
    if (orderDetails?.client_phone) return orderDetails.client_phone;
    return customerDetails?.phone || 'Téléphone non renseigné';
  };

  const getClientEmail = () => {
    if (orderDetails?.client_email) return orderDetails.client_email;
    return customerDetails?.email || 'Email non disponible';
  };

  const getDeliveryAddress = () => {
    // Vérifier d'abord si nous avons les informations de livraison directement dans l'ordre
    if (orderDetails?.delivery_street) {
      return (
        <>
          <div>{orderDetails.delivery_street}</div>
          {orderDetails.delivery_postal_code && orderDetails.delivery_city && (
            <div>{orderDetails.delivery_postal_code} {orderDetails.delivery_city}</div>
          )}
        </>
      );
    }
    
    // Sinon, utiliser les informations d'adresse stockées
    if (addressDetails) {
      return (
        <>
          <div>{addressDetails.street}</div>
          <div>{addressDetails.postal_code} {addressDetails.city}</div>
          {addressDetails.additional_info && (
            <div className="text-sm text-muted-foreground">{addressDetails.additional_info}</div>
          )}
        </>
      );
    }
    
    return <div>Adresse non disponible</div>;
  };
  
  // Extraire le produit offert des notes client
  const getFreeProduct = () => {
    if (!orderDetails?.customer_notes) return null;
    
    const match = orderDetails.customer_notes.match(/Produit offert sélectionné: (.*)/i);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  };

  // Utilisation d'une feuille latérale pour les petits écrans et d'une boîte de dialogue pour les écrans plus grands
  const isMobile = window.innerWidth < 768;
  const freeProduct = getFreeProduct();

  // Si c'est un appareil mobile, utiliser Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full h-[100dvh] flex flex-col pt-12 px-4">
          <div className="flex-none">
            <h2 className="flex items-center gap-2 font-semibold text-xl">
              <ClipboardList className="h-5 w-5" />
              Détails de la commande #{orderDetails?.id?.substring(0, 8)}
            </h2>
            {orderDetails && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(orderDetails.status)}>
                    {translateStatus(orderDetails.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Commande passée le {formatDate(orderDetails.created_at)}</span>
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : orderDetails ? (
            <div className="flex-1 overflow-y-auto mt-6 -mx-4 px-4">
              <div className="space-y-6">
                {/* Informations client */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Informations client</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {getClientName()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{getClientEmail()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{getClientPhone()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Informations supplémentaires */}
                {(orderDetails.allergies || orderDetails.customer_notes || freeProduct) && (
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
                    
                    {freeProduct && (
                      <div className="flex items-start gap-2">
                        <Gift className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Produit offert:</div>
                          <div className="text-sm font-semibold text-amber-700">
                            {freeProduct}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {orderDetails.customer_notes && !freeProduct && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">Notes du client:</div>
                          {orderDetails.customer_notes.includes('Options sélectionnées') ? (
                            <div className="space-y-2">
                              {/* Afficher les notes normales */}
                              {orderDetails.customer_notes.split('\n\n')[0] && (
                                <div className="text-sm italic">"{orderDetails.customer_notes.split('\n\n')[0]}"</div>
                              )}
                              
                              {/* Afficher les options du panier avec style spécial */}
                              <div className="bg-gold-50 border border-gold-200 rounded-lg p-3 mt-2">
                                <div className="font-medium text-gold-800 text-sm mb-1">🍜 Options sélectionnées :</div>
                                <div className="text-sm text-gold-700 space-y-1">
                                  {orderDetails.customer_notes
                                    .split('\n')
                                    .filter(line => line.includes('Sauces:') || line.includes('Accompagnements:') || line.includes('Baguettes:'))
                                    .map((line, idx) => (
                                      <p key={idx} className="font-medium">{line.replace(/^- /, '')}</p>
                                    ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm italic">"{orderDetails.customer_notes}"</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Informations de livraison */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Informations de livraison</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {orderDetails.order_type === 'delivery' ? (
                        <span>Livraison prévue: {formatDate(orderDetails.scheduled_for)}</span>
                      ) : (
                        <span>Retrait prévu: {formatDate(orderDetails.scheduled_for)}</span>
                      )}
                    </div>
                    
                    {(orderDetails.order_type === 'delivery' || orderDetails.delivery_street) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Adresse de livraison:</div>
                          {getDeliveryAddress()}
                        </div>
                      </div>
                    )}
                    
                    {orderDetails.delivery_instructions && (
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="font-medium">Instructions de livraison:</div>
                        <div className="italic text-sm">"{orderDetails.delivery_instructions}"</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Informations de paiement */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Informations de paiement</h3>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {translatePaymentMethod(orderDetails.payment_method)}
                    <Badge 
                      variant={orderDetails.payment_status === 'paid' ? 'success' : 'outline'}
                      className="ml-2"
                    >
                      {translatePaymentStatus(orderDetails.payment_status)}
                    </Badge>
                  </div>
                </div>
                
                {/* Alert pour les commandes sans articles */}
                {order && <MissingItemsAlert order={order} />}
                
                {/* Produits commandés */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Produits commandés</h3>
                  <div className="border rounded-md divide-y">
                    {orderDetails.order_items && orderDetails.order_items.length > 0 ? (
                      orderDetails.order_items.map((item: any, index: number) => (
                        <div key={item.id || index} className="p-4 flex justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-lg">
                              {item.name || `Produit ${item.id?.substring(0, 8) || 'inconnu'}`}
                            </div>
                            {item.special_instructions && (
                              <div className="text-sm text-muted-foreground italic mt-1">
                                "{item.special_instructions}"
                              </div>
                            )}
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-base">{item.quantity} x {(item.price || 0).toFixed(2)} €</div>
                            <div className="font-semibold text-lg">
                              {((item.quantity || 1) * (item.price || 0)).toFixed(2)} €
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        Aucun produit trouvé
                      </div>
                    )}
                    
                    {/* Afficher le produit offert comme un élément distinct dans la liste des produits commandés */}
                    {freeProduct && (
                      <div className="p-4 flex justify-between bg-amber-50">
                        <div className="flex-1">
                          <div className="font-medium text-lg flex items-center">
                            <Gift className="h-4 w-4 text-amber-600 mr-2" />
                            {freeProduct} <span className="ml-2 text-amber-600">(OFFERT)</span>
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-base">1 x 0.00 €</div>
                          <div className="font-semibold text-lg">0.00 €</div>
                        </div>
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
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Impossible de récupérer les détails de la commande
            </div>
          )}
          
          <div className="flex-none pt-4">
            <Button onClick={() => onOpenChange(false)} className="w-full">Fermer</Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Pour les écrans plus grands, utiliser Dialog avec ScrollArea
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Détails de la commande #{orderDetails?.id?.substring(0, 8)}
          </DialogTitle>
          <DialogDescription>
            {orderDetails && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(orderDetails.status)}>
                    {translateStatus(orderDetails.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Commande passée le {formatDate(orderDetails.created_at)}</span>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : orderDetails ? (
          <div className="overflow-y-auto pr-4 max-h-[60vh]">
            <div className="space-y-6">
              {/* Informations client */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Informations client</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {getClientName()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{getClientEmail()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{getClientPhone()}</span>
                  </div>
                </div>
              </div>
              
              {/* Informations supplémentaires */}
              {(orderDetails.allergies || orderDetails.customer_notes || freeProduct) && (
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
                  
                  {freeProduct && (
                    <div className="flex items-start gap-2">
                      <Gift className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Produit offert:</div>
                        <div className="text-sm font-semibold text-amber-700">
                          {freeProduct}
                        </div>
                      </div>
                    </div>
                  )}
                  
                    {orderDetails.customer_notes && !freeProduct && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium">Notes du client:</div>
                          {orderDetails.customer_notes.includes('Options sélectionnées') ? (
                            <div className="space-y-2">
                              {/* Afficher les notes normales */}
                              {orderDetails.customer_notes.split('\n\n')[0] && (
                                <div className="text-sm italic">"{orderDetails.customer_notes.split('\n\n')[0]}"</div>
                              )}
                              
                              {/* Afficher les options du panier avec style spécial */}
                              <div className="bg-gold-50 border border-gold-200 rounded-lg p-3 mt-2">
                                <div className="font-medium text-gold-800 text-sm mb-1">🍜 Options sélectionnées :</div>
                                <div className="text-sm text-gold-700 space-y-1">
                                  {orderDetails.customer_notes
                                    .split('\n')
                                    .filter(line => line.includes('Sauces:') || line.includes('Accompagnements:') || line.includes('Baguettes:'))
                                    .map((line, idx) => (
                                      <p key={idx} className="font-medium">{line.replace(/^- /, '')}</p>
                                    ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm italic">"{orderDetails.customer_notes}"</div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
              
              {/* Informations de livraison */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Informations de livraison</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {orderDetails.order_type === 'delivery' ? (
                      <span>Livraison prévue: {formatDate(orderDetails.scheduled_for)}</span>
                    ) : (
                      <span>Retrait prévu: {formatDate(orderDetails.scheduled_for)}</span>
                    )}
                  </div>
                  
                  {(orderDetails.order_type === 'delivery' || orderDetails.delivery_street) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">Adresse de livraison:</div>
                        {getDeliveryAddress()}
                      </div>
                    </div>
                  )}
                  
                  {orderDetails.delivery_instructions && (
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="font-medium">Instructions de livraison:</div>
                      <div className="italic text-sm">"{orderDetails.delivery_instructions}"</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Informations de paiement */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Informations de paiement</h3>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {translatePaymentMethod(orderDetails.payment_method)}
                  <Badge 
                    variant={orderDetails.payment_status === 'paid' ? 'success' : 'outline'}
                    className="ml-2"
                  >
                    {translatePaymentStatus(orderDetails.payment_status)}
                  </Badge>
                </div>
              </div>
              
              {/* Produits commandés */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Produits commandés</h3>
                <div className="border rounded-md divide-y">
                  {orderDetails.order_items && orderDetails.order_items.length > 0 ? (
                    orderDetails.order_items.map((item: any, index: number) => (
                      <div key={item.id || index} className="p-4 flex justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-lg">
                            {item.name || `Produit ${item.id?.substring(0, 8) || 'inconnu'}`}
                          </div>
                          {item.special_instructions && (
                            <div className="text-sm text-muted-foreground italic mt-1">
                              "{item.special_instructions}"
                            </div>
                          )}
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="text-base">{item.quantity} x {(item.price || 0).toFixed(2)} €</div>
                          <div className="font-semibold text-lg">
                            {((item.quantity || 1) * (item.price || 0)).toFixed(2)} €
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted-foreground">
                      Aucun produit trouvé
                    </div>
                  )}
                  
                  {/* Afficher le produit offert comme un élément distinct dans la liste des produits commandés */}
                  {freeProduct && (
                    <div className="p-4 flex justify-between bg-amber-50">
                      <div className="flex-1">
                        <div className="font-medium text-lg flex items-center">
                          <Gift className="h-4 w-4 text-amber-600 mr-2" />
                          {freeProduct} <span className="ml-2 text-amber-600">(OFFERT)</span>
                        </div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="text-base">1 x 0.00 €</div>
                        <div className="font-semibold text-lg">0.00 €</div>
                      </div>
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
          </div>
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
