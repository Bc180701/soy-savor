
import { motion } from "framer-motion";
import { Ban, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useOrderingLockStatus } from "@/hooks/useOrderingLockStatus";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

const OrderingLockedMessage = () => {
  const { currentRestaurant } = useRestaurantContext();
  const { isOrderingLocked, isLoading } = useOrderingLockStatus();

  // Si les commandes ne sont pas verrouillées, ne pas afficher le message
  if (!isOrderingLocked && !isLoading) {
    return null;
  }

  // Afficher un loading pendant la vérification
  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="flex justify-center mb-6">
          <Ban size={80} className="text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Commandes Temporairement Fermées</h1>
        
        <Alert variant="destructive" className="mb-8 border-red-500">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Commandes indisponibles</AlertTitle>
          <AlertDescription>
            Nous sommes désolés, mais notre service de commande en ligne est temporairement indisponible
            {currentRestaurant && ` pour ${currentRestaurant.name}`}.
            Veuillez réessayer ultérieurement ou nous contacter par téléphone.
          </AlertDescription>
        </Alert>
        
        <p className="text-gray-600 mb-8">
          Cette interruption de service peut être due à une fermeture exceptionnelle, à un jour férié, 
          ou à une maintenance technique. Nous nous excusons pour la gêne occasionnée et vous remercions 
          de votre compréhension.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
          <Button asChild>
            <Link to="/contact">Nous contacter</Link>
          </Button>
        </div>

        {/* Debug info en développement */}
        <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-left">
          <p><strong>Debug Info:</strong></p>
          <p>Restaurant: {currentRestaurant?.name || 'Non sélectionné'}</p>
          <p>Commandes verrouillées: {isOrderingLocked ? 'Oui' : 'Non'}</p>
          <p>Chargement: {isLoading ? 'Oui' : 'Non'}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderingLockedMessage;
