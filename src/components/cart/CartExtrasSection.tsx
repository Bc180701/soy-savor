import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [baguettesQuantity, setBaguettesQuantity] = useState<number>(1);
  const [couvertsSelected, setCouvertsSelected] = useState<boolean>(false);
  const [cuilleresSelected, setCuilleresSelected] = useState<boolean>(false);
  const { addItem, removeItem, selectedRestaurantId, items, getTotalPrice } = useCart();
  const getRestaurantId = () => selectedRestaurantId || items[0]?.menuItem.restaurant_id;

  // Notifier le parent des changements pour débloquer le bouton continuer
  useEffect(() => {
    const hasAnySauceSelection = selectedSauces.length > 0 || 
      items.some(item => item.menuItem.category === "Sauce");
    
    if (hasAnySauceSelection) {
      onExtrasChange({
        sauces: selectedSauces,
        accompagnements: selectedAccompagnements,
        baguettes: baguettesSelected,
        couverts: couvertsSelected,
        cuilleres: cuilleresSelected
      });
    }
  }, [selectedSauces, selectedAccompagnements, baguettesSelected, couvertsSelected, cuilleresSelected, items, onExtrasChange]);

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

    // Calculer les sauces à ajouter (logique globale simplifiée)
    const freeSaucesCount = getFreeSaucesCount();
    const totalSaucesSelected = getTotalSelectedSauces();
    
    let freeSaucesRemaining = freeSaucesCount;
    
    selectedSauces.forEach(sauce => {
      if (sauce.quantity > 0) {
        // Calculer combien de cette sauce sont gratuites
        const freeSaucesForThisSauce = Math.min(sauce.quantity, freeSaucesRemaining);
        const paidSaucesForThisSauce = sauce.quantity - freeSaucesForThisSauce;
        
        freeSaucesRemaining -= freeSaucesForThisSauce;
        
        // Ajouter une seule entrée avec le bon prix et description
        if (sauce.quantity > 0) {
          const isAllFree = freeSaucesForThisSauce === sauce.quantity;
          const isAllPaid = freeSaucesForThisSauce === 0;
          
          let name = sauce.name;
          let description = "";
          let price = 0;
          
          if (isAllFree) {
            description = `Sauce gratuite (${sauce.quantity}x)`;
            price = 0;
          } else if (isAllPaid) {
            description = `Sauce supplémentaire (${sauce.quantity}x)`;
            price = 0.5;
          } else {
            description = `${freeSaucesForThisSauce}x gratuite + ${paidSaucesForThisSauce}x supplémentaire`;
            price = paidSaucesForThisSauce * 0.5 / sauce.quantity; // Prix moyen par unité
          }
          
          itemsToAdd.push({
            id: `sauce-${sauce.name}-${Date.now()}`,
            name: name,
            description: description,
            price: price,
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
          addItem(itemsToAdd[itemsToAdd.length - 1], sauce.quantity);
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
        description: `Baguettes japonaises (${baguettesQuantity}x)`,
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
      if (baguettesItem) addItem(baguettesItem, baguettesQuantity);
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
    setBaguettesQuantity(1);
    setCouvertsSelected(false);
    setCuilleresSelected(false);
  };

  const addSauceToCart = (sauce: string, quantity: number) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    // Calculer les sauces gratuites/payantes
    const freeSaucesCount = getFreeSaucesCount();
    const existingSauceItems = items.filter(item => 
      item.menuItem.category === "Sauce" && 
      (item.menuItem.name === sauce || item.menuItem.name.includes(sauce))
    );
    
    // Supprimer les anciennes entrées de cette sauce
    existingSauceItems.forEach(item => {
      removeItem(item.menuItem.id);
    });

    if (quantity > 0) {
      // Calculer combien de sauces sont déjà dans le panier (autres que celle-ci)
      const otherSauceItems = items.filter(item => 
        item.menuItem.category === "Sauce" && 
        !item.menuItem.name.includes(sauce)
      );
      const otherSaucesCount = otherSauceItems.reduce((sum, item) => sum + item.quantity, 0);
      
      const freeSaucesRemaining = Math.max(0, freeSaucesCount - otherSaucesCount);
      const freeSaucesForThisSauce = Math.min(quantity, freeSaucesRemaining);
      const paidSaucesForThisSauce = quantity - freeSaucesForThisSauce;
      
      let description = "";
      let price = 0;
      
      if (freeSaucesForThisSauce > 0 && paidSaucesForThisSauce > 0) {
        description = `${freeSaucesForThisSauce}x gratuite + ${paidSaucesForThisSauce}x supplémentaire`;
        price = paidSaucesForThisSauce * 0.5 / quantity;
      } else if (freeSaucesForThisSauce > 0) {
        description = `Sauce gratuite (${quantity}x)`;
        price = 0;
      } else {
        description = `Sauce supplémentaire (${quantity}x)`;
        price = 0.5;
      }
      
      const sauceItem = {
        id: `sauce-${sauce}-${Date.now()}`,
        name: sauce,
        description: description,
        price: price,
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
      };
      
      addItem(sauceItem, quantity);
    }
  };

  const handleSauceToggle = (sauce: string) => {
    const existingSauce = selectedSauces.find(s => s.name === sauce);
    if (existingSauce) {
      const newSauces = selectedSauces.filter(s => s.name !== sauce);
      setSelectedSauces(newSauces);
      addSauceToCart(sauce, 0); // Supprimer du panier
    } else {
      const newSauces = [...selectedSauces, { name: sauce, quantity: 1 }];
      setSelectedSauces(newSauces);
      if (sauce !== "Aucune") {
        addSauceToCart(sauce, 1); // Ajouter au panier
      }
    }
  };

  const updateSauceQuantity = (sauce: string, change: number) => {
    setSelectedSauces(prev => {
      const newSauces = prev.map(s => 
        s.name === sauce 
          ? { ...s, quantity: Math.max(0, s.quantity + change) }
          : s
      ).filter(s => s.quantity > 0);
      
      // Ajouter automatiquement au panier avec la nouvelle quantité
      const updatedSauce = newSauces.find(s => s.name === sauce);
      const newQuantity = updatedSauce ? updatedSauce.quantity : 0;
      addSauceToCart(sauce, newQuantity);
      
      return newSauces;
    });
  };

  const addAccompagnementToCart = (accompagnements: string[]) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    // Supprimer l'ancien item d'accompagnements
    const existingAccompagnementItems = items.filter(item => item.menuItem.category === "Accompagnement");
    existingAccompagnementItems.forEach(item => {
      removeItem(item.menuItem.id);
    });

    if (accompagnements.length > 0) {
      const accompagnementItem = {
        id: `accompagnements-${Date.now()}`,
        name: `Accompagnements: ${accompagnements.join(', ')}`,
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
      };
      addItem(accompagnementItem, 1);
    }
  };

  const addAccessoireToCart = (name: string, description: string, isSelected: boolean) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    // Supprimer l'ancien item de cet accessoire
    const existingAccessoireItems = items.filter(item => item.menuItem.name === name);
    existingAccessoireItems.forEach(item => {
      removeItem(item.menuItem.id);
    });

    if (isSelected) {
      const accessoireItem = {
        id: `${name.toLowerCase()}-${Date.now()}`,
        name: name,
        description: description,
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
      };
      addItem(accessoireItem, 1);
    }
  };

  const handleAccompagnementToggle = (accompagnement: string) => {
    let newAccompagnements;
    if (selectedAccompagnements.includes(accompagnement)) {
      newAccompagnements = selectedAccompagnements.filter(a => a !== accompagnement);
    } else {
      newAccompagnements = [...selectedAccompagnements, accompagnement];
    }
    setSelectedAccompagnements(newAccompagnements);
    addAccompagnementToCart(newAccompagnements);
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
              
              // Calculer les coûts de manière globale et simple
              const freeSaucesCount = getFreeSaucesCount();
              const totalSelected = getTotalSelectedSauces();
              
              // Calculer combien de sauces gratuites il reste avant cette sauce
              let freeSaucesUsedBefore = 0;
              selectedSauces.forEach(s => {
                if (s.name !== sauce) {
                  freeSaucesUsedBefore += s.quantity;
                }
              });
              
              const freeSaucesRemaining = Math.max(0, freeSaucesCount - freeSaucesUsedBefore);
              const freeSaucesForThisSauce = Math.min(quantity, freeSaucesRemaining);
              const paidSaucesForThisSauce = Math.max(0, quantity - freeSaucesForThisSauce);
              const totalCost = paidSaucesForThisSauce * 0.5;
              
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
                    {isSelected && (
                      <div className="text-xs">
                        {freeSaucesForThisSauce > 0 && (
                          <span className="text-green-600 font-medium">
                            {freeSaucesForThisSauce}x gratuit
                          </span>
                        )}
                        {freeSaucesForThisSauce > 0 && paidSaucesForThisSauce > 0 && <span className="text-gray-400"> + </span>}
                        {paidSaucesForThisSauce > 0 && (
                          <span className="text-orange-600 font-medium">
                            {paidSaucesForThisSauce}x +{totalCost.toFixed(2)}€
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isSelected && sauce !== "Aucune" && (
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
          <div className="grid grid-cols-1 gap-3">
            <div className={`space-y-2 p-3 border rounded-lg ${isBaguettesDisabled ? 'bg-gray-100' : 'bg-white'}`}>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="baguettes"
                  checked={baguettesSelected}
                  onCheckedChange={(checked) => {
                    if (!isBaguettesDisabled) {
                      setBaguettesSelected(checked as boolean);
                      if (!checked) {
                        setBaguettesQuantity(1);
                      }
                    }
                  }}
                  disabled={isBaguettesDisabled}
                />
                <label htmlFor="baguettes" className={`text-sm font-medium flex-1 ${isBaguettesDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}>
                  Baguettes japonaises {isBaguettesDisabled && "(déjà ajouté)"}
                </label>
              </div>
              {baguettesSelected && !isBaguettesDisabled && (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-600">Quantité :</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBaguettesQuantity(Math.max(1, baguettesQuantity - 1))}
                      disabled={baguettesQuantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{baguettesQuantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBaguettesQuantity(baguettesQuantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Couverts */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🍽️ Couverts</h4>
          <div className={`flex items-center space-x-3 p-3 border rounded-lg ${isCouvertsDisabled ? 'bg-gray-100' : 'bg-white'}`}>
            <Checkbox
              id="couverts"
              checked={couvertsSelected}
              onCheckedChange={(checked) => {
                if (!isCouvertsDisabled) {
                  setCouvertsSelected(checked as boolean);
                  addAccessoireToCart("Couverts", "Couverts demandés", checked as boolean);
                }
              }}
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
              onCheckedChange={(checked) => {
                if (!isCuilleresDisabled) {
                  setCuilleresSelected(checked as boolean);
                  addAccessoireToCart("Cuillères", "Cuillères demandées", checked as boolean);
                }
              }}
              disabled={isCuilleresDisabled}
            />
            <label htmlFor="cuilleres" className={`text-sm font-medium flex-1 ${isCuilleresDisabled ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer'}`}>
              Cuillères {isCuilleresDisabled && "(déjà ajouté)"}
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};