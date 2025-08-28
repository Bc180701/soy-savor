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
  baguettes: number;
  couverts: number;
  cuilleres: number;
}

export const CartExtrasSection = ({ onExtrasChange }: CartExtrasSectionProps) => {
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [selectedAccompagnements, setSelectedAccompagnements] = useState<string[]>([]);
  const [baguettesCount, setBaguettesCount] = useState<number>(0);
  const [couvertsCount, setCouvertsCount] = useState<number>(0);
  const [cuilleresCount, setCuilleresCount] = useState<number>(0);
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

  const addSauceToCart = (sauce: string) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    addItem({
      id: `sauce-${sauce}-${Date.now()}`,
      name: `Sauce: ${sauce}`,
      description: "Sauce pour la commande",
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
    }, 1);
  };

  const addAccompagnementToCart = (accompagnement: string) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    addItem({
      id: `accompagnement-${accompagnement}-${Date.now()}`,
      name: `Accompagnement: ${accompagnement}`,
      description: "Accompagnement pour la commande",
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
    }, 1);
  };

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

    if (baguettesCount > 0) {
      itemsToAdd.push({
        id: `baguettes-${Date.now()}`,
        name: `Baguettes (${baguettesCount} ${baguettesCount === 1 ? 'paire' : 'paires'})`,
        description: "Baguettes japonaises",
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

    if (couvertsCount > 0) {
      itemsToAdd.push({
        id: `couverts-${Date.now()}`,
        name: `Couverts (${couvertsCount} ${couvertsCount === 1 ? 'set' : 'sets'})`,
        description: "Couteau et fourchette",
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

    if (cuilleresCount > 0) {
      itemsToAdd.push({
        id: `cuilleres-${Date.now()}`,
        name: `Cuillères (${cuilleresCount} ${cuilleresCount === 1 ? 'cuillère' : 'cuillères'})`,
        description: "Cuillères",
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
    setBaguettesCount(0);
    setCouvertsCount(0);
    setCuilleresCount(0);
    setHasSubmitted(true);
  };

  const addBaguettesToCart = () => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    addItem({
      id: `baguettes-${Date.now()}`,
      name: "Baguettes (1 paire)",
      description: "Baguettes japonaises",
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
    }, 1);
  };

  const addCouvertsToCart = () => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    addItem({
      id: `couverts-${Date.now()}`,
      name: "Couverts (1 set)",
      description: "Couteau et fourchette",
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
    }, 1);
  };

  const addCuilleresToCart = () => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    addItem({
      id: `cuilleres-${Date.now()}`,
      name: "Cuillères (1 cuillère)",
      description: "Cuillères",
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
    }, 1);
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
            🥢 Sauce
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {saucesOptions.map((sauce) => (
              <div key={sauce} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <span className="text-sm font-medium">{sauce}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSauceToCart(sauce)}
                  className="h-8 px-3 border-gold-400 hover:bg-gold-100"
                >
                  +1
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Accompagnements */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🌶️ Accompagnements</h4>
          <div className="grid grid-cols-1 gap-3">
            {accompagnementsOptions.map((accompagnement) => (
              <div key={accompagnement} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <span className="text-sm font-medium">{accompagnement}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addAccompagnementToCart(accompagnement)}
                  className="h-8 px-3 border-gold-400 hover:bg-gold-100"
                >
                  +1
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Baguettes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🥢 Baguettes</h4>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
            <span className="text-sm font-medium">Baguettes (1 paire)</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBaguettesToCart}
              className="h-8 px-3 border-gold-400 hover:bg-gold-100"
            >
              +1
            </Button>
          </div>
        </div>

        {/* Couverts */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🍽️ Couverts (couteau/fourchette)</h4>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
            <span className="text-sm font-medium">Couverts (1 set)</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCouvertsToCart}
              className="h-8 px-3 border-gold-400 hover:bg-gold-100"
            >
              +1
            </Button>
          </div>
        </div>

        {/* Cuillères */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🥄 Cuillères</h4>
          <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
            <span className="text-sm font-medium">Cuillères (1 cuillère)</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCuilleresToCart}
              className="h-8 px-3 border-gold-400 hover:bg-gold-100"
            >
              +1
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};