import { useEffect, useState } from "react";
import { CheckCircle, Package, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const CommandeConfirmee = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const { toast } = useToast();

  // Créer la commande si elle n'existe pas déjà
  useEffect(() => {
    const createOrderFromSession = async () => {
      if (!sessionId || orderCreated || isCreatingOrder) return;

      setIsCreatingOrder(true);
      try {
        // Vérifier si la commande existe déjà
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (existingOrder) {
          setOrderCreated(true);
          setIsCreatingOrder(false);
          return;
        }

        // Récupérer les données du panier depuis localStorage
        const cartData = localStorage.getItem('cart-storage');
        const restaurantData = localStorage.getItem('restaurant-storage');
        const deliveryData = localStorage.getItem('delivery-info');

        if (!cartData) {
          throw new Error('Données de panier manquantes');
        }

        const cart = JSON.parse(cartData);
        const restaurant = restaurantData ? JSON.parse(restaurantData) : null;
        const delivery = deliveryData ? JSON.parse(deliveryData) : null;

        // Calculer les totaux depuis le panier
        const items = cart.state?.items || [];
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.menuItem.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const deliveryFee = delivery?.orderType === "delivery" ? 3.50 : 0;
        const tip = delivery?.tip || 0;
        const total = subtotal + tax + deliveryFee + tip;

        // Créer la commande
        const orderData = {
          stripe_session_id: sessionId,
          restaurant_id: restaurant?.state?.selectedRestaurant?.id || "11111111-1111-1111-1111-111111111111",
          subtotal,
          tax,
          delivery_fee: deliveryFee,
          tip,
          total,
          discount: 0,
          order_type: delivery?.orderType || "delivery",
          status: 'confirmed',
          payment_method: 'credit-card',
          payment_status: 'paid',
          scheduled_for: new Date().toISOString(),
          client_name: delivery?.name || "Client",
          client_email: delivery?.email || "",
          client_phone: delivery?.phone || "",
          delivery_street: delivery?.street || null,
          delivery_city: delivery?.city || null,
          delivery_postal_code: delivery?.postalCode || null,
          customer_notes: delivery?.notes || null,
        };

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (orderError) throw orderError;

        // Ajouter les articles
        if (items.length > 0) {
          const orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.menuItem.id,
            quantity: item.quantity,
            price: item.menuItem.price,
            special_instructions: item.specialInstructions || null,
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) throw itemsError;
        }

        // Vider le panier
        localStorage.removeItem('cart-storage');
        localStorage.removeItem('delivery-info');
        
        setOrderCreated(true);
        
        toast({
          title: "Commande créée",
          description: "Votre commande a été enregistrée avec succès.",
        });

      } catch (error) {
        console.error('Erreur création commande:', error);
        toast({
          title: "Erreur",
          description: "Problème lors de l'enregistrement de la commande.",
          variant: "destructive",
        });
      } finally {
        setIsCreatingOrder(false);
      }
    };

    createOrderFromSession();
  }, [sessionId, orderCreated, isCreatingOrder, toast]);

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

        {sessionId && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Détails de votre commande</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Numéro de session : <span className="font-mono">{sessionId}</span>
              </p>
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