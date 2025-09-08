import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

interface CartExtrasSectionProps {
  onExtrasChange: (extras: CartExtras) => void;
}

export interface CartExtras {
  sauces: string[];
  accompagnements: string[];
  baguettes: boolean;
  couverts: boolean;
  cuilleres: boolean;
}

export const CartExtrasSection = ({ onExtrasChange }: CartExtrasSectionProps) => {
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [selectedAccompagnements, setSelectedAccompagnements] = useState<string[]>([]);
  const [baguettesSelected, setBaguettesSelected] = useState<boolean>(false);
  const [couvertsSelected, setCouvertsSelected] = useState<boolean>(false);
  const [cuilleresSelected, setCuilleresSelected] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { addItem, selectedRestaurantId, items } = useCart();
  const getRestaurantId = () => selectedRestaurantId || items[0]?.menuItem.restaurant_id;

  const saucesOptions = [
    "Soja sucrée",
    "Soja salée",
    "Aucune"
  ];

  const accompagnementsOptions = [
    "Wasabi",
    "Gingembre"
  ];

  // Vérifier quels accompagnements sont déjà dans le panier
  const getDisabledSauces = () => {
    const sauceItems = items.filter(item => item.menuItem.category === "Sauce");
    const disabledSauces: string[] = [];
    
    sauceItems.forEach(item => {
      const sauceName = item.menuItem.name.replace("Sauces: ", "");
      saucesOptions.forEach(sauce => {
        if (sauceName.includes(sauce)) {
          disabledSauces.push(sauce);
        }
      });
    });
    
    return disabledSauces;
  };

  const getDisabledAccompagnements = () => {
    const accompagnementItems = items.filter(item => item.menuItem.category === "Accompagnement");
    const disabledAccompagnements: string[] = [];
    
    accompagnementItems.forEach(item => {
      const accompagnementName = item.menuItem.name.replace("Accompagnements: ", "");
      accompagnementsOptions.forEach(accompagnement => {
        if (accompagnementName.includes(accompagnement)) {
          disabledAccompagnements.push(accompagnement);
        }
      });
    });
    
    return disabledAccompagnements;
  };

  const isBaguettesDisabled = items.some(item => item.menuItem.name === "Baguettes");
  const isCouvertsDisabled = items.some(item => item.menuItem.name === "Couverts");
  const isCuilleresDisabled = items.some(item => item.menuItem.name === "Cuillères");

  const disabledSauces = getDisabledSauces();
  const disabledAccompagnements = getDisabledAccompagnements();

  const handleAddAccompagnements = () => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    const itemsToAdd: any[] = [];

    if (selectedSauces.length > 0) {
      itemsToAdd.push({
        id: `sauces-${Date.now()}`,
        name: `Sauces: ${selectedSauces.join(', ')}`,
        description: "Sauces pour la commande",
        price: 0,
        imageUrl: "",
        category: "Sauce" as const,
        restaurant_id: restaurantId,
        isVegetarian: true,
        isSpicy: false,
        isNew: false,
        isBestSeller: false,
        isGlutenFree: true,
        allergens: [],
        pieces: null,
        prepTime: null
      });
    }

    if (selectedAccompagnements.length > 0) {
      itemsToAdd.push({
        id: `accompagnements-${Date.now()}`,
        name: `Accompagnements: ${selectedAccompagnements.join(', ')}`,
        description: "Accompagnements pour la commande",
        price: 0,
        imageUrl: "",
        category: "Accompagnement" as const,
        restaurant_id: restaurantId,
        isVegetarian: true,
        isSpicy: false,
        isNew: false,
        isBestSeller: false,
        isGlutenFree: true,
        allergens: [],
        pieces: null,
        prepTime: null
      });
    }

    if (baguettesSelected) {
      itemsToAdd.push({
        id: `baguettes-${Date.now()}`,
        name: `Baguettes`,
        description: "Baguettes japonaises demandées",
        price: 0,
        imageUrl: "",
        category: "Accessoire" as const,
        restaurant_id: restaurantId,
        isVegetarian: true,
        isSpicy: false,
        isNew: false,
        isBestSeller: false,
        isGlutenFree: true,
        allergens: [],
        pieces: null,
        prepTime: null
      });
    }

    if (couvertsSelected) {
      itemsToAdd.push({
        id: `couverts-${Date.now()}`,
        name: `Couverts`,
        description: "Couverts demandés",
        price: 0,
        imageUrl: "",
        category: "Accessoire" as const,
        restaurant_id: restaurantId,
        isVegetarian: true,
        isSpicy: false,
        isNew: false,
        isBestSeller: false,
        isGlutenFree: true,
        allergens: [],
        pieces: null,
        prepTime: null
      });
    }

    if (cuilleresSelected) {
      itemsToAdd.push({
        id: `cuilleres-${Date.now()}`,
        name: `Cuillères`,
        description: "Cuillères demandées",
        price: 0,
        imageUrl: "",
        category: "Accessoire" as const,
        restaurant_id: restaurantId,
        isVegetarian: true,
        isSpicy: false,
        isNew: false,
        isBestSeller: false,
        isGlutenFree: true,
        allergens: [],
        pieces: null,
        prepTime: null
      });
    }

    if (itemsToAdd.length === 0) return;

    itemsToAdd.forEach((it) => addItem(it, 1));

    setSelectedSauces([]);
    setSelectedAccompagnements([]);
    setBaguettesSelected(false);
    setCouvertsSelected(false);
    setCuilleresSelected(false);
    setHasSubmitted(true);
  };

  const handleSauceToggle = (sauce: string) => {
    if (selectedSauces.includes(sauce)) {
      setSelectedSauces(selectedSauces.filter(s => s !== sauce));
    } else {
      setSelectedSauces([...selectedSauces, sauce]);
    }
  };

  const handleAccompagnementToggle = (accompagnement: string) => {
    if (selectedAccompagnements.includes(accompagnement)) {
      setSelectedAccompagnements(selectedAccompagnements.filter(a => a !== accompagnement));
    } else {
      setSelectedAccompagnements([...selectedAccompagnements, accompagnement]);
    }
  };

  return (
    <Card className="w-full border-2 border-gold-300 bg-gold-50">
      <CardHeader>
        <CardTitle className="text-gold-800 flex items-center gap-2">
          🍜 Options de commande
          <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            Obligatoire
          </span>
        </CardTitle>
        <CardDescription className="text-gold-600">
          Veuillez choisir vos préférences pour les sauces et accompagnements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sauces */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            🥢 Sauces
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {saucesOptions.map((sauce) => {
              const isDisabled = disabledSauces.includes(sauce);
              return (
                <div key={sauce} className={`flex items-center space-x-3 p-3 border rounded-lg ${isDisabled ? 'bg-gray-100' : 'bg-white'}`}>
                  <Checkbox
                    id={`sauce-${sauce}`}
                    checked={selectedSauces.includes(sauce)}
                    onCheckedChange={() => !isDisabled && handleSauceToggle(sauce)}
                    disabled={isDisabled}
                  />
                  <label 
                    htmlFor={`sauce-${sauce}`} 
                    className={`text-sm font-medium flex-1 ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {sauce} {isDisabled && "(déjà ajouté)"}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accompagnements */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🌶️ Accompagnements</h4>
          <div className="grid grid-cols-1 gap-3">
            {accompagnementsOptions.map((accompagnement) => {
              const isDisabled = disabledAccompagnements.includes(accompagnement);
              return (
                <div key={accompagnement} className={`flex items-center space-x-3 p-3 border rounded-lg ${isDisabled ? 'bg-gray-100' : 'bg-white'}`}>
                  <Checkbox
                    id={`accompagnement-${accompagnement}`}
                    checked={selectedAccompagnements.includes(accompagnement)}
                    onCheckedChange={() => !isDisabled && handleAccompagnementToggle(accompagnement)}
                    disabled={isDisabled}
                  />
                  <label 
                    htmlFor={`accompagnement-${accompagnement}`} 
                    className={`text-sm font-medium flex-1 ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {accompagnement} {isDisabled && "(déjà ajouté)"}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Baguettes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🥢 Baguettes</h4>
          <div className={`flex items-center space-x-3 p-3 border rounded-lg ${isBaguettesDisabled ? 'bg-gray-100' : 'bg-white'}`}>
            <Checkbox
              id="baguettes"
              checked={baguettesSelected}
              onCheckedChange={(checked) => !isBaguettesDisabled && setBaguettesSelected(checked as boolean)}
              disabled={isBaguettesDisabled}
            />
            <label htmlFor="baguettes" className={`text-sm font-medium flex-1 ${isBaguettesDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}>
              Baguettes japonaises {isBaguettesDisabled && "(déjà ajouté)"}
            </label>
          </div>
        </div>

        {/* Couverts */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🍽️ Couverts</h4>
          <div className={`flex items-center space-x-3 p-3 border rounded-lg ${isCouvertsDisabled ? 'bg-gray-100' : 'bg-white'}`}>
            <Checkbox
              id="couverts"
              checked={couvertsSelected}
              onCheckedChange={(checked) => !isCouvertsDisabled && setCouvertsSelected(checked as boolean)}
              disabled={isCouvertsDisabled}
            />
            <label htmlFor="couverts" className={`text-sm font-medium flex-1 ${isCouvertsDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}>
              Couteau et fourchette {isCouvertsDisabled && "(déjà ajouté)"}
            </label>
          </div>
        </div>

        {/* Cuillères */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🥄 Cuillères</h4>
          <div className={`flex items-center space-x-3 p-3 border rounded-lg ${isCuilleresDisabled ? 'bg-gray-100' : 'bg-white'}`}>
            <Checkbox
              id="cuilleres"
              checked={cuilleresSelected}
              onCheckedChange={(checked) => !isCuilleresDisabled && setCuilleresSelected(checked as boolean)}
              disabled={isCuilleresDisabled}
            />
            <label htmlFor="cuilleres" className={`text-sm font-medium flex-1 ${isCuilleresDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}>
              Cuillères {isCuilleresDisabled && "(déjà ajouté)"}
            </label>
          </div>
        </div>

        {/* Bouton pour ajouter tous les extras sélectionnés */}
        <div className="pt-4">
          <Button
            type="button"
            onClick={handleAddAccompagnements}
            className="w-full bg-gold-600 hover:bg-gold-700 text-white"
            disabled={selectedSauces.length === 0 && selectedAccompagnements.length === 0 && !baguettesSelected && !couvertsSelected && !cuilleresSelected}
          >
            Ajouter les accompagnements sélectionnés
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};