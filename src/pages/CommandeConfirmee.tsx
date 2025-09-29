
import { useEffect, useState } from "react";
import { CheckCircle, Package, Truck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const CommandeConfirmee = () => {
  const [searchParams] = useSearchParams();
  const { orderId } = useParams();
  const sessionId = searchParams.get("session_id");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [finalOrderId, setFinalOrderId] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [maxAttempts] = useState(5); // Augmenté à 5 tentatives
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  // Vérifier et créer la commande via l'edge function
  useEffect(() => {
    const verifyAndCreateOrder = async () => {
      // Si on a un orderId valide dans l'URL (pas juste le paramètre ":orderId")
      if (orderId && orderId !== ':orderId' && !orderId.startsWith(':')) {
        console.log('✅ Order ID trouvé dans URL:', orderId);
        await fetchOrderDetails(orderId);
        setOrderCreated(true);
        setFinalOrderId(orderId);
        
        // Vider le panier localStorage
        localStorage.removeItem('cart-storage');
        localStorage.removeItem('delivery-info');
        
        return;
      }

      // Sinon, on procède avec la vérification du paiement Stripe
      if (!sessionId || orderCreated || isCreatingOrder) {
        return;
      }

      // Limiter le nombre de tentatives
      if (verificationAttempts >= maxAttempts) {
        console.log('⚠️ Nombre maximum de tentatives atteint');
        setHasError(true);
        
        toast({
          title: "Commande en cours de traitement",
          description: "Votre paiement a été effectué. La commande sera bientôt disponible dans votre compte.",
          variant: "default",
        });
        return;
      }

      setIsCreatingOrder(true);
      setVerificationAttempts(prev => prev + 1);
      
      try {
        console.log('🔍 Tentative', verificationAttempts + 1, '/', maxAttempts, '- Vérification paiement pour session:', sessionId);

        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error) {
          console.error('❌ Erreur edge function:', error);
          throw error;
        }

        if (data.success) {
          console.log('✅ Commande traitée:', data.orderId, '- Message:', data.message);
          
          if (data.orderDetails) {
            setOrderDetails(data.orderDetails);
          } else {
            await fetchOrderDetails(data.orderId);
          }
          
          setOrderCreated(true);
          setFinalOrderId(data.orderId);
          
          // Vider le panier localStorage
          localStorage.removeItem('cart-storage');
          localStorage.removeItem('delivery-info');
          
          toast({
            title: "Commande confirmée !",
            description: data.message || `Votre commande #${data.orderId} a été traitée avec succès.`,
          });

          // Rediriger vers l'URL avec l'orderId
          window.history.replaceState(null, '', `/commande-confirmee/${data.orderId}`);
        } else {
          throw new Error(data.error || 'Erreur lors de la vérification du paiement');
        }

      } catch (error) {
        console.error('❌ Erreur vérification paiement (tentative', verificationAttempts + 1, '):', error);
        
        // Attendre un peu avant la prochaine tentative
        if (verificationAttempts + 1 < maxAttempts) {
          setTimeout(() => {
            // La prochaine tentative se fera au prochain cycle useEffect
          }, 2000);
        } else {
          console.log('⚠️ Dernière tentative échouée');
          setHasError(true);
          
          toast({
            title: "Commande en cours de traitement",
            description: "Votre paiement a été effectué. Veuillez vérifier votre compte dans quelques minutes ou contactez-nous.",
            variant: "default",
          });
        }
      } finally {
        setIsCreatingOrder(false);
      }
    };

    verifyAndCreateOrder();
  }, [sessionId, orderId, orderCreated, isCreatingOrder, verificationAttempts, maxAttempts, toast]);

  // Fonction pour récupérer les détails de la commande
  const fetchOrderDetails = async (orderIdToFetch: string) => {
    try {
      console.log('📋 Récupération détails commande:', orderIdToFetch);
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderIdToFetch)
        .single();

      if (orderError) {
        console.error('❌ Erreur récupération commande:', orderError);
        return;
      }

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name, description, price)
        `)
        .eq('order_id', orderIdToFetch);

      if (itemsError) {
        console.error('❌ Erreur récupération articles:', itemsError);
      }

      const orderWithItems = {
        ...order,
        items: orderItems || []
      };

      console.log('✅ Détails commande récupérés:', orderWithItems);
      setOrderDetails(orderWithItems);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des détails:', error);
    }
  };

  // Fonction pour réessayer la vérification
  const retryVerification = () => {
    setVerificationAttempts(0);
    setHasError(false);
    setIsCreatingOrder(false);
  };

  if (isCreatingOrder) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-20 h-20 text-blue-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2">Finalisation de votre commande...</h1>
          <p className="text-gray-600">
            Nous enregistrons votre commande dans notre système.
            {verificationAttempts > 0 && ` (Tentative ${verificationAttempts}/${maxAttempts})`}
          </p>
        </div>
      </div>
    );
  }

  if (hasError && !orderCreated) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="w-20 h-20 text-orange-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Commande en cours de traitement</h1>
          <p className="text-gray-600 mb-6">
            Votre paiement a été effectué avec succès, mais nous avons besoin de quelques minutes pour finaliser votre commande.
          </p>
          
          <div className="space-y-4">
            <Button onClick={retryVerification} className="w-full">
              Réessayer la vérification
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/compte">
                Voir mes commandes
              </Link>
            </Button>
          </div>
          
          {sessionId && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">
                  Référence de paiement : <span className="font-mono text-xs">{sessionId}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Commande confirmée !
          </h1>
          <p className="text-gray-600">
            Merci pour votre commande. Votre paiement a été traité avec succès.
          </p>
        </div>

        {finalOrderId && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Détails de votre commande</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-left space-y-2">
                <p className="text-sm text-gray-600">
                  Numéro de commande : <span className="font-mono font-bold">{finalOrderId}</span>
                </p>
                
                {orderDetails && (
                  <>
                    <p className="text-sm text-gray-600">
                      Type : <span className="font-medium">
                        {orderDetails.order_type === 'delivery' ? 'Livraison' : 
                         orderDetails.order_type === 'pickup' ? 'À emporter' : 'Sur place'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Total : <span className="font-bold">{orderDetails.total}€</span>
                    </p>
                    
                    {orderDetails.items && orderDetails.items.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">Articles commandés :</h4>
                        <div className="space-y-1">
                          {orderDetails.items.map((item: any, index: number) => (
                            <div key={index} className="text-xs text-gray-600 flex justify-between">
                              <span>{item.quantity}x {item.products?.name || `Article ${item.product_id.slice(0, 8)}...`}</span>
                              <span>{(item.price * item.quantity).toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                    
                    {/* Notes du client */}
                    {orderDetails.customer_notes && (
                      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">📝 Notes :</h4>
                        <div className="text-xs text-gray-700 whitespace-pre-wrap">
                          {orderDetails.customer_notes}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {sessionId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Session : <span className="font-mono">{sessionId}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Préparation</h3>
              <p className="text-sm text-gray-600">
                Votre commande est maintenant en cours de préparation par nos chefs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Truck className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">
                {orderDetails?.order_type === 'delivery' ? 'Livraison' : 'Récupération'}
              </h3>
              <p className="text-sm text-gray-600">
                Vous recevrez une notification quand votre commande sera prête
                {orderDetails?.order_type === 'delivery' ? ' ou en cours de livraison' : ' à récupérer'}.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/compte">
              Voir mes commandes
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/carte">
              Continuer mes achats
            </Link>
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Besoin d'aide ?</strong> Contactez-nous au{" "}
            <a href="tel:0490947120" className="font-semibold underline">
              04 90 94 71 20
            </a>{" "}
            ou par email à{" "}
            <a href="mailto:contact@sushieats.fr" className="font-semibold underline">
              contact@sushieats.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommandeConfirmee;
