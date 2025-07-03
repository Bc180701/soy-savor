
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Package, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";

const CommandeConfirmee = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Récupérer les détails de la commande à partir de la session Stripe
      fetchOrderDetails(sessionId);
      // Vider le panier après confirmation
      clearCart();
    } else {
      // Si pas de session_id, rediriger vers l'accueil
      navigate('/');
    }
  }, [searchParams, navigate, clearCart]);

  const fetchOrderDetails = async (sessionId: string) => {
    try {
      console.log("Récupération des détails de la commande pour la session:", sessionId);
      
      // Récupérer la commande par stripe_session_id
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, price)
          )
        `)
        .eq('stripe_session_id', sessionId)
        .single();

      if (error) {
        console.error("Erreur lors de la récupération de la commande:", error);
      } else {
        console.log("Détails de la commande récupérés:", order);
        setOrderDetails(order);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Commande confirmée !
          </h1>
          <p className="text-gray-600">
            Merci pour votre commande. Nous avons bien reçu votre paiement.
          </p>
        </motion.div>

        {orderDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Commande #{orderDetails.id.slice(0, 8)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Commandé le {new Date(orderDetails.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {orderDetails.order_type === 'delivery' && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Livraison à: {orderDetails.delivery_street}, {orderDetails.delivery_postal_code} {orderDetails.delivery_city}
                    </span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Articles commandés:</h3>
                  <div className="space-y-2">
                    {orderDetails.order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.products?.name || 'Article'}</span>
                        <span>{(item.price * item.quantity).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{orderDetails.subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA</span>
                    <span>{orderDetails.tax.toFixed(2)} €</span>
                  </div>
                  {orderDetails.delivery_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Frais de livraison</span>
                      <span>{orderDetails.delivery_fee.toFixed(2)} €</span>
                    </div>
                  )}
                  {orderDetails.tip > 0 && (
                    <div className="flex justify-between">
                      <span>Pourboire</span>
                      <span>{orderDetails.tip.toFixed(2)} €</span>
                    </div>
                  )}
                  {orderDetails.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Réduction</span>
                      <span>-{orderDetails.discount.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{orderDetails.total.toFixed(2)} €</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center space-y-4"
        >
          <p className="text-gray-600">
            Vous recevrez un email de confirmation à l'adresse indiquée lors de votre commande.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Retour à l'accueil
            </Button>
            <Button onClick={() => navigate('/menu')}>
              Voir notre menu
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CommandeConfirmee;
