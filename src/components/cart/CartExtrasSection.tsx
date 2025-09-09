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
  sauces: { name: string; quantity: number }[];
  accompagnements: string[];
  baguettes: boolean;
  couverts: boolean;
  cuilleres: boolean;
}

export const CartExtrasSection = ({ onExtrasChange }: CartExtrasSectionProps) => {
  const [selectedSauces, setSelectedSauces] = useState<{ name: string; quantity: number }[]>([]);
  const [selectedAccompagnements, setSelectedAccompagnements] = useState<string[]>([]);
  const [baguettesSelected, setBaguettesSelected] = useState<boolean>(false);
  const [couvertsSelected, setCouvertsSelected] = useState<boolean>(false);
  const [cuilleresSelected, setCuilleresSelected] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { addItem, selectedRestaurantId, items, getTotalPrice } = useCart();
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

  // Calculer le nombre de sauces gratuites selon le total du panier
  const getFreeSaucesCount = () => {
    const total = getTotalPrice();
    return Math.floor(total / 10);
  };

  const getTotalSelectedSauces = () => {
    return selectedSauces.reduce((sum, sauce) => sum + sauce.quantity, 0);
  };

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

    const freeSaucesCount = getFreeSaucesCount();
    const totalSaucesSelected = getTotalSelectedSauces();
    
    selectedSauces.forEach(sauce => {
      if (sauce.quantity > 0) {
        const freeSauces = Math.min(sauce.quantity, freeSaucesCount);
        const paidSauces = Math.max(0, sauce.quantity - freeSauces);
        
        // Ajouter les sauces gratuites
        if (freeSauces > 0) {
          itemsToAdd.push({
            id: `sauce-free-${sauce.name}-${Date.now()}`,
            name: `${sauce.name}`,
            description: `Sauce gratuite (${freeSauces}x)`,
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
          addItem(itemsToAdd[itemsToAdd.length - 1], freeSauces);
        }
        
        // Ajouter les sauces payantes
        if (paidSauces > 0) {
          itemsToAdd.push({
            id: `sauce-paid-${sauce.name}-${Date.now()}`,
            name: `${sauce.name}`,
            description: `Sauce supplémentaire (${paidSauces}x)`,
            price: 0.5,
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
          addItem(itemsToAdd[itemsToAdd.length - 1], paidSauces);
        }
      }
    });

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

    // Les sauces sont déjà ajoutées individuellement ci-dessus
    // Ajouter les autres items normalement
    if (selectedAccompagnements.length > 0) {
      const accompItem = itemsToAdd.find(item => item.category === "Accompagnement");
      if (accompItem) addItem(accompItem, 1);
    }
    
    if (baguettesSelected) {
      const baguettesItem = itemsToAdd.find(item => item.name === "Baguettes");
      if (baguettesItem) addItem(baguettesItem, 1);
    }
    
    if (couvertsSelected) {
      const couvertsItem = itemsToAdd.find(item => item.name === "Couverts");
      if (couvertsItem) addItem(couvertsItem, 1);
    }
    
    if (cuilleresSelected) {
      const cuilleresItem = itemsToAdd.find(item => item.name === "Cuillères");
      if (cuilleresItem) addItem(cuilleresItem, 1);
    }

    setSelectedSauces([]);
    setSelectedAccompagnements([]);
    setBaguettesSelected(false);
    setCouvertsSelected(false);
    setCuilleresSelected(false);
    setHasSubmitted(true);
  };

  const handleSauceToggle = (sauce: string) => {
    const existingSauce = selectedSauces.find(s => s.name === sauce);
    if (existingSauce) {
      setSelectedSauces(selectedSauces.filter(s => s.name !== sauce));
    } else {
      setSelectedSauces([...selectedSauces, { name: sauce, quantity: 1 }]);
    }
  };

  const updateSauceQuantity = (sauce: string, change: number) => {
    setSelectedSauces(prev => 
      prev.map(s => 
        s.name === sauce 
          ? { ...s, quantity: Math.max(0, s.quantity + change) }
          : s
      ).filter(s => s.quantity > 0)
    );
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
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {getFreeSaucesCount()} gratuite{getFreeSaucesCount() > 1 ? 's' : ''} (1 tous les 10€)
            </span>
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {saucesOptions.map((sauce) => {
              const isDisabled = disabledSauces.includes(sauce);
              const selectedSauce = selectedSauces.find(s => s.name === sauce);
              const isSelected = !!selectedSauce;
              const quantity = selectedSauce?.quantity || 0;
              const freeSauces = getFreeSaucesCount();
              const totalSelected = getTotalSelectedSauces();
              const extraCost = Math.max(0, quantity - Math.max(0, freeSauces - (totalSelected - quantity))) * 0.5;
              
              return (
                <div key={sauce} className={`space-y-2 p-3 border rounded-lg ${isDisabled ? 'bg-gray-100' : 'bg-white'}`}>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`sauce-${sauce}`}
                      checked={isSelected}
                      onCheckedChange={() => !isDisabled && handleSauceToggle(sauce)}
                      disabled={isDisabled}
                    />
                    <label 
                      htmlFor={`sauce-${sauce}`} 
                      className={`text-sm font-medium flex-1 ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {sauce} {isDisabled && "(déjà ajouté)"}
                    </label>
                    {extraCost > 0 && (
                      <span className="text-xs text-orange-600 font-medium">
                        +{extraCost.toFixed(2)}€
                      </span>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm text-gray-600">Quantité:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateSauceQuantity(sauce, -1)}
                          disabled={quantity <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateSauceQuantity(sauce, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
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
            disabled={getTotalSelectedSauces() === 0 && selectedAccompagnements.length === 0 && !baguettesSelected && !couvertsSelected && !cuilleresSelected}
          >
            Ajouter les accompagnements sélectionnés
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};