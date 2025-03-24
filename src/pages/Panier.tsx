
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useOrder } from "@/hooks/use-order";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { createOrder } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";

const Panier = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const cart = useCart();
  const orderStore = useOrder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Vérifier si l'utilisateur est connecté
  useState(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  });

  const handleIncrement = (id: string) => {
    cart.incrementQuantity(id);
  };

  const handleDecrement = (id: string) => {
    cart.decrementQuantity(id);
  };

  const handleRemove = (id: string) => {
    cart.removeItem(id);
    toast({
      title: "Article supprimé",
      description: "L'article a été retiré de votre panier",
    });
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour passer une commande",
      });
      // Rediriger vers la page de connexion
      navigate("/login");
      return;
    }
    
    // Créer la commande dans la base de données
    const result = await createOrder({
      items: cart.items,
      subtotal: cart.total,
      tax: cart.total * 0.1, // 10% de TVA
      deliveryFee: 2.50,
      total: cart.total + 2.50 + (cart.total * 0.1),
      orderType: "delivery", // Par défaut
      paymentMethod: "credit-card", // Par défaut
      scheduledFor: new Date(Date.now() + 1800000) // 30 minutes à partir de maintenant
    });
    
    if (result.success) {
      // Enregistrer les informations de commande dans le stockage local
      const order = {
        items: cart.items,
        total: cart.total,
        date: new Date().toISOString()
      };
      
      orderStore.createOrder(order);
      
      // Vider le panier
      cart.clearCart();
      
      setIsProcessing(false);
      
      toast({
        title: "Commande validée !",
        description: "Votre commande a été enregistrée avec succès",
      });
      
      // Rediriger vers la page de compte
      navigate("/compte");
    } else {
      setIsProcessing(false);
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result.error || "Une erreur est survenue lors du traitement de votre commande",
      });
    }
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Votre Panier</h1>
        <p className="text-gray-600 text-center mb-12">
          Vérifiez vos articles et procédez au paiement
        </p>

        {cart.items.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <ShoppingBag className="h-12 w-12 text-gray-300" />
                <h2 className="text-2xl font-semibold">Votre panier est vide</h2>
                <p className="text-gray-600 mb-6">
                  Vous n'avez pas encore ajouté d'articles à votre panier
                </p>
                <Button asChild className="bg-akane-600 hover:bg-akane-700">
                  <Link to="/commander">
                    Découvrir notre menu
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Articles ({cart.items.length})</h2>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y divide-gray-100">
                    {cart.items.map((item) => (
                      <li key={item.menuItem.id} className="py-6 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                            <img
                              src={item.menuItem.imageUrl || '/placeholder.svg'}
                              alt={item.menuItem.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium">{item.menuItem.name}</h3>
                            <p className="text-akane-600 font-semibold mt-1">
                              {item.menuItem.price.toFixed(2)} €
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDecrement(item.menuItem.id)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleIncrement(item.menuItem.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-red-500"
                            onClick={() => handleRemove(item.menuItem.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{cart.total.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA (10%)</span>
                      <span>{(cart.total * 0.1).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de livraison</span>
                      <span>2.50 €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{(cart.total + 2.50 + (cart.total * 0.1)).toFixed(2)} €</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-akane-600 hover:bg-akane-700"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      "Traitement en cours..."
                    ) : (
                      <>
                        Valider la commande
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Panier;
