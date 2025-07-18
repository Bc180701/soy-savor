
import { useEffect, useState } from "react";
import { CheckCircle, Package, Truck, Loader2 } from "lucide-react";
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
  const { toast } = useToast();

  // Vérifier et créer la commande via l'edge function
  useEffect(() => {
    const verifyAndCreateOrder = async () => {
      // Si on a un orderId valide dans l'URL (pas juste le paramètre ":orderId")
      if (orderId && orderId !== ':orderId' && !orderId.startsWith(':')) {
        setOrderCreated(true);
        setFinalOrderId(orderId);
        
        // Vider le panier localStorage
        localStorage.removeItem('cart-storage');
        localStorage.removeItem('delivery-info');
        
        console.log('✅ Commande déjà créée avec ID:', orderId);
        return;
      }

      // Sinon, on procède avec la vérification du paiement Stripe
      if (!sessionId || orderCreated || isCreatingOrder) return;

      setIsCreatingOrder(true);
      try {
        console.log('🔍 Vérification paiement pour session:', sessionId);

        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId }
        });

        if (error) {
          throw error;
        }

        if (data.success) {
          setOrderCreated(true);
          setFinalOrderId(data.orderId);
          
          // Vider le panier localStorage
          localStorage.removeItem('cart-storage');
          localStorage.removeItem('delivery-info');
          
          toast({
            title: "Commande confirmée !",
            description: `Votre commande #${data.orderId} a été créée avec succès.`,
          });

          console.log('✅ Commande créée:', data.orderId);
        } else {
          throw new Error(data.error || 'Erreur lors de la vérification du paiement');
        }

      } catch (error) {
        console.error('❌ Erreur vérification paiement:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier votre paiement. Contactez le support.",
          variant: "destructive",
        });
      } finally {
        setIsCreatingOrder(false);
      }
    };

    verifyAndCreateOrder();
  }, [sessionId, orderId, orderCreated, isCreatingOrder, toast]);

  if (isCreatingOrder) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="w-20 h-20 text-blue-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2">Finalisation de votre commande...</h1>
          <p className="text-gray-600">Veuillez patienter pendant que nous enregistrons votre commande.</p>
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
              <p className="text-sm text-gray-600">
                Numéro de commande : <span className="font-mono font-bold">{finalOrderId}</span>
              </p>
              {sessionId && (
                <p className="text-sm text-gray-500 mt-2">
                  Session : <span className="font-mono">{sessionId}</span>
                </p>
              )}
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
              <h3 className="font-semibold mb-2">Livraison</h3>
              <p className="text-sm text-gray-600">
                Vous recevrez une notification quand votre commande sera prête ou en cours de livraison.
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
            <Link to="/menu">
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
