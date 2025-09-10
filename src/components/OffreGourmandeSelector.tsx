import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OffreGourmandeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptOffer: () => void;
  onDeclineOffer: () => void;
}

export const OffreGourmandeSelector = ({ 
  isOpen, 
  onClose, 
  onAcceptOffer,
  onDeclineOffer 
}: OffreGourmandeSelectorProps) => {
  
  const handleAccept = () => {
    console.log("🍰 Utilisateur accepte l'offre gourmande");
    onAcceptOffer();
  };

  const handleDecline = () => {
    console.log("❌ Utilisateur refuse l'offre gourmande");
    onDeclineOffer();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            🍰 Offre Gourmande Spéciale !
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 text-center space-y-4">
          <div className="text-lg font-medium text-foreground">
            Voulez-vous profiter de notre offre gourmande supplémentaire ?
          </div>
          
          <div className="text-sm text-muted-foreground">
            Ajoutez un dessert délicieux et recevez une boisson soft offerte !
          </div>
          
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg">
            <div className="text-sm font-medium text-primary">
              🎁 1 Dessert acheté = 1 Boisson offerte
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={handleDecline}
            className="flex-1"
          >
            Non merci
          </Button>
          <Button 
            onClick={handleAccept}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80"
          >
            Oui, j'en profite ! 🍰
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};