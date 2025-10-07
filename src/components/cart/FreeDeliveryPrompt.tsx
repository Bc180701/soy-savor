import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, ShoppingCart } from "lucide-react";
import { formatEuro } from "@/utils/formatters";
import { useNavigate } from "react-router-dom";

interface FreeDeliveryPromptProps {
  subtotal: number;
  orderType: "delivery" | "pickup";
  restaurantId?: string;
}

export const FreeDeliveryPrompt = ({ subtotal, orderType, restaurantId }: FreeDeliveryPromptProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const FREE_DELIVERY_THRESHOLD = 35;
  const MIN_THRESHOLD = 25;

  useEffect(() => {
    // Attendre 3 secondes avant d'afficher le pop-up pour laisser le temps à l'utilisateur de choisir "à emporter"
    const timer = setTimeout(() => {
      // Afficher le pop-up seulement pour les livraisons et si le montant est entre 25€ et 35€
      if (orderType === "delivery" && subtotal >= MIN_THRESHOLD && subtotal < FREE_DELIVERY_THRESHOLD) {
        // Vérifier si l'utilisateur n'a pas déjà fermé le pop-up dans cette session
        const hasSeenPrompt = sessionStorage.getItem("freeDeliveryPromptSeen");
        if (!hasSeenPrompt) {
          setIsOpen(true);
        }
      }
    }, 3000);

    // Nettoyer le timer si le composant est démonté ou si les dépendances changent
    return () => clearTimeout(timer);
  }, [subtotal, orderType]);

  const handleClose = () => {
    setIsOpen(false);
    // Marquer comme vu pour cette session
    sessionStorage.setItem("freeDeliveryPromptSeen", "true");
  };

  const handleAddMoreItems = () => {
    handleClose();
    // Naviguer vers /commander avec le restaurant_id dans le state
    navigate("/commander", { state: { preselectedRestaurantId: restaurantId } });
  };

  const remainingAmount = FREE_DELIVERY_THRESHOLD - subtotal;

  if (orderType !== "delivery" || subtotal < MIN_THRESHOLD || subtotal >= FREE_DELIVERY_THRESHOLD) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="w-6 h-6 text-primary" />
            Livraison gratuite bientôt !
          </DialogTitle>
          <DialogDescription className="text-base pt-4">
            <div className="space-y-4">
              <p className="text-foreground font-medium">
                Plus que <span className="text-primary font-bold text-lg">{formatEuro(remainingAmount)}</span> pour profiter de la livraison gratuite !
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Votre total actuel</span>
                  <span className="font-medium">{formatEuro(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Livraison gratuite à partir de</span>
                  <span className="font-bold text-primary">{formatEuro(FREE_DELIVERY_THRESHOLD)}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Ajoutez quelques articles supplémentaires pour économiser sur les frais de livraison !
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-2 mt-4">
          <Button 
            onClick={handleAddMoreItems} 
            className="w-full"
            size="lg"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Ajouter des articles
          </Button>
          <Button 
            onClick={handleClose} 
            variant="ghost"
            size="lg"
          >
            Continuer sans modifier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
