import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types";

interface BoissonOfferteSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onBoissonSelected: (boisson: MenuItem) => void;
  restaurantId?: string;
}

export const BoissonOfferteSelector = ({ 
  isOpen, 
  onClose, 
  onBoissonSelected,
  restaurantId 
}: BoissonOfferteSelectorProps) => {
  const [selectedBoisson, setSelectedBoisson] = useState<string>("");

  const boissons = [
    {
      id: 'eau-plate',
      name: "Eau plate",
      description: "Bouteille d'eau plate",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    },
    {
      id: 'oasis-tropical',
      name: "Oasis tropical",
      description: "Boisson aux fruits tropicaux",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    },
    {
      id: 'eau-gazeuse',
      name: "Eau gazeuse",
      description: "Bouteille d'eau gazeuse",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    },
    {
      id: 'fuzetea-vert-citron',
      name: "Fuzetea thé vert citron",
      description: "Thé glacé au citron",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    },
    {
      id: 'coca-cola-zero',
      name: "Coca-Cola zéro",
      description: "Coca-Cola sans sucre",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    },
    {
      id: 'coca-cola',
      name: "Coca-Cola",
      description: "Coca-Cola original",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    },
    {
      id: 'fuzetea-noir-peche',
      name: "Fuzetea thé noir pêche",
      description: "Thé glacé à la pêche",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    },
    {
      id: 'orangina',
      name: "Orangina",
      description: "Boisson pétillante à l'orange",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    },
    {
      id: 'coca-cola-cherry',
      name: "Coca-Cola cherry",
      description: "Coca-Cola parfum cerise",
      price: 0,
      category: 'boissons' as any,
      restaurant_id: restaurantId
    }
  ];

  const handleConfirm = () => {
    const selected = boissons.find(boisson => boisson.id === selectedBoisson);
    if (selected) {
      onBoissonSelected(selected);
      onClose();
      setSelectedBoisson("");
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedBoisson("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎉 Boisson offerte !</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Félicitations ! Grâce à votre accompagnement gratuit et votre dessert, 
            choisissez une boisson soft offerte :
          </p>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {boissons.map((boisson) => (
              <div 
                key={boisson.id} 
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent select-none ${
                  selectedBoisson === boisson.id 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedBoisson(boisson.id)}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedBoisson === boisson.id 
                    ? 'border-primary-foreground bg-primary-foreground' 
                    : 'border-input bg-background'
                }`}>
                  {selectedBoisson === boisson.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{boisson.name}</div>
                  <div className={`text-sm ${
                    selectedBoisson === boisson.id 
                      ? 'text-primary-foreground/80' 
                      : 'text-muted-foreground'
                  }`}>
                    {boisson.description}
                  </div>
                </div>
                <span className="text-green-600 font-medium text-sm flex-shrink-0">Gratuit</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Passer
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedBoisson}
            className="flex-1"
          >
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
