import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MenuItem } from "@/types";

interface AccompagnementSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAccompagnementSelected: (accompagnement: MenuItem) => void;
  restaurantId?: string;
}

export const AccompagnementSelector = ({ 
  isOpen, 
  onClose, 
  onAccompagnementSelected,
  restaurantId 
}: AccompagnementSelectorProps) => {
  const [selectedAccompagnement, setSelectedAccompagnement] = useState<string>("");

  const accompagnements = [
    {
      id: `riz-nature-${Date.now()}`,
      name: "Riz nature",
      description: "Riz blanc japonais",
      price: 0,
      category: 'accompagnements' as any,
      restaurant_id: restaurantId,
      isVegetarian: true,
      isSpicy: false,
      isNew: true,
      isBestSeller: false,
      isGlutenFree: true
    },
    {
      id: `riz-vinaigre-${Date.now()}`,
      name: "Riz vinaigré",
      description: "Riz à sushi",
      price: 0,
      category: 'accompagnements' as any,
      restaurant_id: restaurantId,
      isVegetarian: true,
      isSpicy: false,
      isNew: true,
      isBestSeller: false,
      isGlutenFree: true
    },
    {
      id: `salade-chou-${Date.now()}`,
      name: "Salade de chou",
      description: "Salade de chou japonaise",
      price: 0,
      category: 'accompagnements' as any,
      restaurant_id: restaurantId,
      isVegetarian: true,
      isSpicy: false,
      isNew: true,
      isBestSeller: false,
      isGlutenFree: true
    },
    {
      id: `soupe-miso-${Date.now()}`,
      name: "Soupe miso",
      description: "Soupe miso traditionnelle",
      price: 0,
      category: 'accompagnements' as any,
      restaurant_id: restaurantId,
      isVegetarian: false,
      isSpicy: false,
      isNew: true,
      isBestSeller: false,
      isGlutenFree: false
    }
  ];

  const handleConfirm = () => {
    const selected = accompagnements.find(acc => acc.id === selectedAccompagnement);
    if (selected) {
      onAccompagnementSelected(selected);
      onClose();
      setSelectedAccompagnement("");
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedAccompagnement("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisissez votre accompagnement offert</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Votre box inclut un accompagnement gratuit. Choisissez votre préférence :
          </p>
          
          <RadioGroup 
            value={selectedAccompagnement} 
            onValueChange={setSelectedAccompagnement}
            className="space-y-3"
          >
            {accompagnements.map((accompagnement) => (
              <div key={accompagnement.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={accompagnement.id} id={accompagnement.id} />
                <div className="flex-1">
                  <Label htmlFor={accompagnement.id} className="flex flex-col cursor-pointer">
                    <span className="font-medium">{accompagnement.name}</span>
                    <span className="text-sm text-gray-500">{accompagnement.description}</span>
                  </Label>
                </div>
                <span className="text-green-600 font-medium text-sm">Gratuit</span>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Passer
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedAccompagnement}
            className="flex-1 bg-gold-500 hover:bg-gold-600 text-black"
          >
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};