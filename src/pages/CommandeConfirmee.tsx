
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Home, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";

const CommandeConfirmee = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [orderCleared, setOrderCleared] = useState(false);

  // Récupérer les paramètres de l'URL de retour Stripe
  const sessionId = searchParams.get('session_id');
  const success = searchParams.get('success');

  useEffect(() => {
    // Vider le panier après une commande réussie
    if ((success === 'true' || sessionId) && !orderCleared) {
      console.log("Commande confirmée, vidage du panier");
      clearCart();
      setOrderCleared(true);
    }
  }, [success, sessionId, clearCart, orderCleared]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="text-center">
          <CardHeader className="pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <CheckCircle className="h-16 w-16 text-green-500" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Commande confirmée !
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-gray-600">
              <p className="mb-2">
                Votre commande a été confirmée et votre paiement a été traité avec succès.
              </p>
              {sessionId && (
                <p className="text-sm text-gray-500">
                  Numéro de session : {sessionId.slice(0, 20)}...
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Que se passe-t-il maintenant ?</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Votre commande est en cours de préparation</li>
                <li>• Vous recevrez un email de confirmation</li>
                <li>• Nous vous tiendrons informé du statut</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1 bg-gold-600 hover:bg-gold-700">
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/menu">
                  <Receipt className="mr-2 h-4 w-4" />
                  Voir le menu
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CommandeConfirmee;
