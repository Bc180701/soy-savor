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
  accompagnements: { name: string; quantity: number }[];
  baguettesQuantity: number;
  fourchettesQuantity: number;
  cuilleresQuantity: number;
}

export const CartExtrasSection = ({ onExtrasChange }: CartExtrasSectionProps) => {
  const [selectedSauces, setSelectedSauces] = useState<{ name: string; quantity: number }[]>([]);
  const [selectedAccompagnements, setSelectedAccompagnements] = useState<{ name: string; quantity: number }[]>([]);
  const [beaucoupWasabi, setBeaucoupWasabi] = useState<boolean>(false);
  const [beaucoupGingembre, setBeaucoupGingembre] = useState<boolean>(false);
  const [baguettesQuantity, setBaguettesQuantity] = useState<number>(0);
  const [fourchettesQuantity, setFourchettesQuantity] = useState<number>(0);
  const [cuilleresQuantity, setCuilleresQuantity] = useState<number>(0);
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
        baguettesQuantity,
        fourchettesQuantity,
        cuilleresQuantity
      });
    }
  }, [selectedSauces, selectedAccompagnements, baguettesQuantity, fourchettesQuantity, cuilleresQuantity, items, onExtrasChange]);

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

  // Calculer le nombre d'accompagnements gratuits selon le total du panier
  const getFreeAccompagnementsCount = () => {
    const total = getTotalPrice();
    return Math.floor(total / 10);
  };

  const getTotalSelectedAccompagnements = () => {
    return selectedAccompagnements.reduce((sum, accomp) => sum + accomp.quantity, 0);
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

  // Supprimer la fonction getDisabledAccompagnements - on permet toujours d'ajouter des accompagnements

  // Calculer les couverts gratuits (1 par 10€ pour chaque type)
  const getFreeBaguettes = () => Math.floor(getTotalPrice() / 10);
  const getFreeFourchettes = () => Math.floor(getTotalPrice() / 10);
  const getFreeCuilleres = () => Math.floor(getTotalPrice() / 10);

  // Vérifier si les couverts sont déjà dans le panier
  const baguettesInCart = items.find(item => 
    item.menuItem.name.toLowerCase().includes('baguettes') ||
    item.menuItem.name.toLowerCase().includes('baguette')
  );

  const fourchettesInCart = items.find(item => 
    item.menuItem.name.toLowerCase().includes('fourchette')
  );

  const cuilleresInCart = items.find(item => 
    item.menuItem.name.toLowerCase().includes('cuillère') ||
    item.menuItem.name.toLowerCase().includes('cuillere')
  );

  const disabledSauces = getDisabledSauces();

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

    // Calculer les accompagnements à ajouter (même logique que les sauces)
    const freeAccompagnementsCount = getFreeAccompagnementsCount();
    let freeAccompagnementsRemaining = freeAccompagnementsCount;
    
    selectedAccompagnements.forEach(accompagnement => {
      if (accompagnement.quantity > 0) {
        // Calculer combien de cet accompagnement sont gratuits
        const freeAccompagnementsForThis = Math.min(accompagnement.quantity, freeAccompagnementsRemaining);
        const paidAccompagnementsForThis = accompagnement.quantity - freeAccompagnementsForThis;
        
        freeAccompagnementsRemaining -= freeAccompagnementsForThis;
        
        // Ajouter une seule entrée avec le bon prix et description
        if (accompagnement.quantity > 0) {
          const isAllFree = freeAccompagnementsForThis === accompagnement.quantity;
          const isAllPaid = freeAccompagnementsForThis === 0;
          
          let name = accompagnement.name;
          let description = "";
          let price = 0;
          
          if (isAllFree) {
            description = `Accompagnement gratuit (${accompagnement.quantity}x)`;
            price = 0;
          } else if (isAllPaid) {
            description = `Accompagnement supplémentaire (${accompagnement.quantity}x)`;
            price = 0.5;
          } else {
            description = `${freeAccompagnementsForThis}x gratuit + ${paidAccompagnementsForThis}x supplémentaire`;
            price = paidAccompagnementsForThis * 0.5 / accompagnement.quantity; // Prix moyen par unité
          }
          
          itemsToAdd.push({
            id: `accompagnement-${accompagnement.name}-${Date.now()}`,
            name: name,
            description: description,
            price: price,
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
          addItem(itemsToAdd[itemsToAdd.length - 1], accompagnement.quantity);
        }
      }
    });


    // Les sauces sont déjà ajoutées individuellement ci-dessus
    // Ajouter les autres items normalement
    if (selectedAccompagnements.length > 0) {
      const accompItem = itemsToAdd.find(item => item.category === "Accompagnement");
      if (accompItem) addItem(accompItem, 1);
    }

    setSelectedSauces([]);
    setSelectedAccompagnements([]);
    setBaguettesQuantity(0);
    setFourchettesQuantity(0);
    setCuilleresQuantity(0);
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

  const addAccompagnementToCart = (accompagnement: string, quantity: number) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    // Calculer les accompagnements gratuits/payants
    const freeAccompagnementsCount = getFreeAccompagnementsCount();
    const existingAccompagnementItems = items.filter(item => 
      item.menuItem.category === "Accompagnement" && 
      (item.menuItem.name === accompagnement || item.menuItem.name.includes(accompagnement))
    );
    
    // Supprimer les anciennes entrées de cet accompagnement
    existingAccompagnementItems.forEach(item => {
      removeItem(item.menuItem.id);
    });

    if (quantity > 0) {
      // Calculer combien d'accompagnements sont déjà dans le panier (autres que celui-ci)
      const otherAccompagnementItems = items.filter(item => 
        item.menuItem.category === "Accompagnement" && 
        !item.menuItem.name.includes(accompagnement)
      );
      const otherAccompagnementsCount = otherAccompagnementItems.reduce((sum, item) => sum + item.quantity, 0);
      
      const freeAccompagnementsRemaining = Math.max(0, freeAccompagnementsCount - otherAccompagnementsCount);
      const freeAccompagnementsForThis = Math.min(quantity, freeAccompagnementsRemaining);
      const paidAccompagnementsForThis = quantity - freeAccompagnementsForThis;
      
      let description = "";
      let price = 0;
      
      if (freeAccompagnementsForThis > 0 && paidAccompagnementsForThis > 0) {
        description = `${freeAccompagnementsForThis}x gratuit + ${paidAccompagnementsForThis}x supplémentaire`;
        price = paidAccompagnementsForThis * 0.5 / quantity;
      } else if (freeAccompagnementsForThis > 0) {
        description = `Accompagnement gratuit (${quantity}x)`;
        price = 0;
      } else {
        description = `Accompagnement supplémentaire (${quantity}x)`;
        price = 0.5;
      }
      
      const accompagnementItem = {
        id: `accompagnement-${accompagnement}-${Date.now()}`,
        name: accompagnement,
        description: description,
        price: price,
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
      
      addItem(accompagnementItem, quantity);
    }
  };

  const handleSauceToggle = (sauce: string) => {
    const restaurantId = getRestaurantId();
    const existingSauce = selectedSauces.find(s => s.name === sauce);
    
    if (existingSauce) {
      const newSauces = selectedSauces.filter(s => s.name !== sauce);
      setSelectedSauces(newSauces);
      
      if (sauce === "Aucune") {
        // Supprimer l'item "Aucune sauce" du panier
        const aucuneItem = items.find(item => item.menuItem?.name === "Aucune sauce");
        if (aucuneItem) {
          removeItem(aucuneItem.menuItem.id);
        }
      } else {
        addSauceToCart(sauce, 0); // Supprimer du panier
      }
    } else {
      const newSauces = [...selectedSauces, { name: sauce, quantity: 1 }];
      setSelectedSauces(newSauces);
      
      if (sauce === "Aucune") {
        // Ajouter un item "Aucune sauce" au panier pour valider le choix
        if (restaurantId) {
          const aucuneItem = {
            id: `sauce-aucune-${Date.now()}`,
            name: "Aucune sauce",
            description: "Pas de sauce demandée",
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
          };
          addItem(aucuneItem, 1);
        }
      } else {
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

  const handleAccompagnementToggle = (accompagnement: string, checked: boolean) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    // Supprimer les anciennes entrées de cet accompagnement
    const existingAccompagnementItems = items.filter(item => 
      item.menuItem.category === "Accompagnement" && 
      (item.menuItem.name === accompagnement || item.menuItem.name.includes(accompagnement))
    );
    existingAccompagnementItems.forEach(item => {
      removeItem(item.menuItem.id);
    });

    if (checked) {
      const accompagnementItem = {
        id: `accompagnement-${accompagnement}-${Date.now()}`,
        name: accompagnement,
        description: "Accompagnement (dosage standard)",
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

  const handleBeaucoupToggle = (accompagnement: string, checked: boolean) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    if (accompagnement === "Wasabi") {
      setBeaucoupWasabi(checked);
    } else if (accompagnement === "Gingembre") {
      setBeaucoupGingembre(checked);
    }

    // Supprimer les anciennes entrées "beaucoup de"
    const existingBeaucoupItems = items.filter(item => 
      item.menuItem.name === `Beaucoup de ${accompagnement.toLowerCase()}`
    );
    existingBeaucoupItems.forEach(item => {
      removeItem(item.menuItem.id);
    });

    if (checked) {
      const beaucoupItem = {
        id: `beaucoup-${accompagnement}-${Date.now()}`,
        name: `Beaucoup de ${accompagnement.toLowerCase()}`,
        description: "Supplément grande quantité",
        price: 0.5,
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
      addItem(beaucoupItem, 1);
    }
  };



  const addBaguettesToCart = (quantity: number) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    const freeCount = getFreeBaguettes();
    const paidCount = Math.max(0, quantity - freeCount);
    
    if (baguettesInCart) {
      removeItem(baguettesInCart.menuItem.id);
    }
    
    if (quantity > 0) {
      const baguettesItem = {
        id: `baguettes-${Date.now()}`,
        name: paidCount > 0 ? `Baguettes (${freeCount} gratuite(s) + ${paidCount} payante(s))` : `Baguettes`,
        description: paidCount > 0 ? `${quantity} baguettes dont ${freeCount} offertes` : `${quantity} baguette(s) offerte(s)`,
        price: paidCount * 0.50 / quantity, // Prix unitaire moyen
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
      
      addItem(baguettesItem, quantity);
    }
  };

  const addFourchettesToCart = (quantity: number) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    const freeCount = getFreeFourchettes();
    const paidCount = Math.max(0, quantity - freeCount);
    
    if (fourchettesInCart) {
      removeItem(fourchettesInCart.menuItem.id);
    }
    
    if (quantity > 0) {
      const fourchettesItem = {
        id: `fourchettes-${Date.now()}`,
        name: paidCount > 0 ? `Fourchettes (${freeCount} gratuite(s) + ${paidCount} payante(s))` : `Fourchettes`,
        description: paidCount > 0 ? `${quantity} fourchettes dont ${freeCount} offertes` : `${quantity} fourchette(s) offerte(s)`,
        price: paidCount * 0.50 / quantity, // Prix unitaire moyen
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
      
      addItem(fourchettesItem, quantity);
    }
  };

  const addCuilleresToCart = (quantity: number) => {
    const restaurantId = getRestaurantId();
    if (!restaurantId) return;

    const freeCount = getFreeCuilleres();
    const paidCount = Math.max(0, quantity - freeCount);
    
    if (cuilleresInCart) {
      removeItem(cuilleresInCart.menuItem.id);
    }
    
    if (quantity > 0) {
      const cuilleresItem = {
        id: `cuilleres-${Date.now()}`,
        name: paidCount > 0 ? `Cuillères (${freeCount} gratuite(s) + ${paidCount} payante(s))` : `Cuillères`,
        description: paidCount > 0 ? `${quantity} cuillères dont ${freeCount} offertes` : `${quantity} cuillère(s) offerte(s)`,
        price: paidCount * 0.50 / quantity, // Prix unitaire moyen
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
      
      addItem(cuilleresItem, quantity);
    }
  };

  const updateBaguettesQuantity = (change: number) => {
    const newQuantity = Math.max(0, Math.min(10, baguettesQuantity + change));
    setBaguettesQuantity(newQuantity);
    addBaguettesToCart(newQuantity);
  };

  const updateFourchettesQuantity = (change: number) => {
    const newQuantity = Math.max(0, Math.min(10, fourchettesQuantity + change));
    setFourchettesQuantity(newQuantity);
    addFourchettesToCart(newQuantity);
  };

  const updateCuilleresQuantity = (change: number) => {
    const newQuantity = Math.max(0, Math.min(10, cuilleresQuantity + change));
    setCuilleresQuantity(newQuantity);
    addCuilleresToCart(newQuantity);
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
              {getFreeSaucesCount()} gratuite{getFreeSaucesCount() > 1 ? 's' : ''}
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
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            🌶️ Accompagnements
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Gratuit (dosage standard)
            </span>
          </h4>
          <p className="text-xs text-gray-500">La cuisine adapte proportionnellement à votre commande</p>
          <div className="grid grid-cols-1 gap-3">
            {accompagnementsOptions.map((accompagnement) => {
              const isWasabi = accompagnement === "Wasabi";
              const isGingembre = accompagnement === "Gingembre";
              const isSelected = items.some(item => 
                item.menuItem.name === accompagnement && 
                item.menuItem.category === "Accompagnement"
              );
              const beaucoupSelected = isWasabi ? beaucoupWasabi : isGingembre ? beaucoupGingembre : false;
              
              return (
                <div key={accompagnement} className="space-y-2 p-3 border rounded-lg bg-white">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`accompagnement-${accompagnement}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleAccompagnementToggle(accompagnement, checked as boolean)}
                    />
                    <label 
                      htmlFor={`accompagnement-${accompagnement}`} 
                      className="text-sm font-medium flex-1 cursor-pointer"
                    >
                      {accompagnement}
                    </label>
                    <span className="text-xs text-green-600 font-medium">Gratuit</span>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center space-x-3 bg-orange-50 p-2 rounded border border-orange-200">
                      <Checkbox
                        id={`beaucoup-${accompagnement}`}
                        checked={beaucoupSelected}
                        onCheckedChange={(checked) => handleBeaucoupToggle(accompagnement, checked as boolean)}
                      />
                      <label 
                        htmlFor={`beaucoup-${accompagnement}`} 
                        className="text-sm flex-1 cursor-pointer"
                      >
                        Beaucoup de {accompagnement.toLowerCase()}
                      </label>
                      <span className="text-xs text-orange-600 font-medium">+0,50€</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Baguettes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            🥢 Baguettes
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {getFreeBaguettes()} gratuite{getFreeBaguettes() > 1 ? 's' : ''}
            </span>
          </h4>
          <div className="space-y-2 p-3 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium leading-none">
                  Baguettes
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  1 paire gratuite par 10€ • +0,50€ par paire supplémentaire
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateBaguettesQuantity(-1)}
                disabled={baguettesQuantity === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[2rem] text-center font-medium">
                {baguettesQuantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateBaguettesQuantity(1)}
                disabled={baguettesQuantity >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {baguettesQuantity > 0 && (
                <div className="text-xs ml-2">
                  {getFreeBaguettes() >= baguettesQuantity ? (
                    <span className="text-green-600 font-medium">
                      Gratuit
                    </span>
                  ) : (
                    <>
                      <span className="text-green-600 font-medium">
                        {getFreeBaguettes()}x gratuite{getFreeBaguettes() > 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-400"> + </span>
                      <span className="text-orange-600 font-medium">
                        {baguettesQuantity - getFreeBaguettes()}x +{((baguettesQuantity - getFreeBaguettes()) * 0.50).toFixed(2)}€
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fourchettes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            🍴 Fourchettes
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {getFreeFourchettes()} gratuite{getFreeFourchettes() > 1 ? 's' : ''}
            </span>
          </h4>
          <div className="space-y-2 p-3 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium leading-none">
                  Fourchettes
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  1 gratuite par 10€ • +0,50€ par fourchette supplémentaire
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateFourchettesQuantity(-1)}
                disabled={fourchettesQuantity === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[2rem] text-center font-medium">
                {fourchettesQuantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateFourchettesQuantity(1)}
                disabled={fourchettesQuantity >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {fourchettesQuantity > 0 && (
                <div className="text-xs ml-2">
                  {getFreeFourchettes() >= fourchettesQuantity ? (
                    <span className="text-green-600 font-medium">
                      Gratuit
                    </span>
                  ) : (
                    <>
                      <span className="text-green-600 font-medium">
                        {getFreeFourchettes()}x gratuite{getFreeFourchettes() > 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-400"> + </span>
                      <span className="text-orange-600 font-medium">
                        {fourchettesQuantity - getFreeFourchettes()}x +{((fourchettesQuantity - getFreeFourchettes()) * 0.50).toFixed(2)}€
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cuillères */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            🥄 Cuillères
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {getFreeCuilleres()} gratuite{getFreeCuilleres() > 1 ? 's' : ''}
            </span>
          </h4>
          <div className="space-y-2 p-3 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium leading-none">
                  Cuillères
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  1 gratuite par 10€ • +0,50€ par cuillère supplémentaire
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateCuilleresQuantity(-1)}
                disabled={cuilleresQuantity === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[2rem] text-center font-medium">
                {cuilleresQuantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateCuilleresQuantity(1)}
                disabled={cuilleresQuantity >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {cuilleresQuantity > 0 && (
                <div className="text-xs ml-2">
                  {getFreeCuilleres() >= cuilleresQuantity ? (
                    <span className="text-green-600 font-medium">
                      Gratuit
                    </span>
                  ) : (
                    <>
                      <span className="text-green-600 font-medium">
                        {getFreeCuilleres()}x gratuite{getFreeCuilleres() > 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-400"> + </span>
                      <span className="text-orange-600 font-medium">
                        {cuilleresQuantity - getFreeCuilleres()}x +{((cuilleresQuantity - getFreeCuilleres()) * 0.50).toFixed(2)}€
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};