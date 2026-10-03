import { useState, useRef } from "react";
import { MenuItem } from "@/types";
import { useCartWithRestaurant } from "./useCartWithRestaurant";
import { toast } from "@/hooks/use-toast";
import { useDessertBoissonOffer } from "./useDessertBoissonOffer";
import { useRestaurantContext } from "./useRestaurantContext";
import { isGourmetOfferAvailable } from "@/services/promotionService";

export const useBoxAccompagnement = () => {
  const { currentRestaurant } = useRestaurantContext();
  const [showAccompagnementSelector, setShowAccompagnementSelector] = useState(false);
  const [pendingBoxItem, setPendingBoxItem] = useState<{
    item: MenuItem;
    quantity: number;
    specialInstructions?: string;
  } | null>(null);
  
  // États pour l'offre dessert/boisson en cascade - MAINTENANT GLOBAL
  const { 
    activateOffer, 
    deactivateOffer, 
    dessertBoissonOfferActive, 
    showBoissonSelector, 
    setShowBoissonSelector,
    selectDessert 
  } = useDessertBoissonOffer();
  const [pendingDessertForBoisson, setPendingDessertForBoisson] = useState<MenuItem | null>(null);
  
  // Flag pour éviter la double exécution lors de la fermeture du popup
  const hasProcessedSelection = useRef(false);
  
  const { addItem, checkDessertForBoissonOffer } = useCartWithRestaurant();

  // Fonction pour vérifier si un item est une box
  const isBoxItem = (item: MenuItem): boolean => {
    console.log("🟦 DEBUG: Vérification box pour item:", item.name, "category:", item.category);
    
    // Vérification plus flexible pour détecter toute catégorie contenant "box"
    const isBox = item.category.toLowerCase().includes('box') || 
                  ['box', 'box_du_midi', 'box_du_midi_stmartin'].includes(item.category);
    
    console.log("🟦 DEBUG: isBox result:", isBox);
    return isBox;
  };

  // Fonction principale d'ajout au panier (appelée depuis ProductsDisplay)
  const handleAddToCart = (item: MenuItem, quantity = 1, specialInstructions?: string) => {
    console.log("🟦 useBoxAccompagnement.handleAddToCart called with:", item.name);
    
    if (isBoxItem(item)) {
      console.log("🟦 C'est une box, ouverture du popup pour:", item.name);
      setPendingBoxItem({ item, quantity, specialInstructions });
      setShowAccompagnementSelector(true);
    } else {
      console.log("🟦 Pas une box, ajout direct:", item.name);
      addItem(item, quantity, specialInstructions);

      // Vérifier si c'est un dessert et si l'offre boisson est active
      if (checkDessertForBoissonOffer(item) && dessertBoissonOfferActive) {
        triggerBoissonOffer(item);
      }
    }
  };

  // Fonction pour gérer la sélection d'accompagnement
  const handleAccompagnementSelected = (accompagnement: MenuItem) => {
    console.log("🟦 Accompagnement sélectionné:", accompagnement.name);
    
    if (pendingBoxItem && !hasProcessedSelection.current) {
      hasProcessedSelection.current = true;
      
      // Ajouter d'abord la box au panier
      console.log("🟦 Ajout de la box au panier:", pendingBoxItem.item.name);
      addItem(pendingBoxItem.item, pendingBoxItem.quantity, pendingBoxItem.specialInstructions);
      
      // Ensuite ajouter l'accompagnement GRATUIT
      console.log("🟦 Ajout de l'accompagnement gratuit:", accompagnement.name);
      const freeAccompagnement = {
        ...accompagnement,
        price: 0,
        originalPrice: accompagnement.price,
        id: `accompagnement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      addItem(freeAccompagnement, 1, "Accompagnement offert avec box");
      
      // L'offre n'est pas proposée le samedi à Saint-Martin-de-Crau,
      // où le premier créneau commence à 18 h.
      if (isGourmetOfferAvailable(currentRestaurant?.id)) {
        activateOffer();
      } else {
        deactivateOffer();
      }
      
      // Nettoyer les états
      setPendingBoxItem(null);
      setShowAccompagnementSelector(false);
      
      // Remettre le flag à false après un court délai
      setTimeout(() => {
        hasProcessedSelection.current = false;
      }, 100);
    }
  };

  // Fonction pour fermer le popup d'accompagnement
  const handleCloseAccompagnementSelector = () => {
    console.log("🟦 Fermeture du popup d'accompagnement");
    
    // Si aucune sélection n'a été faite, ajouter juste la box sans accompagnement
    if (pendingBoxItem && !hasProcessedSelection.current) {
      console.log("🟦 Ajout de la box sans accompagnement:", pendingBoxItem.item.name);
      addItem(pendingBoxItem.item, pendingBoxItem.quantity, pendingBoxItem.specialInstructions);
    }
    
    // Nettoyer et remettre à zéro le flag
    setPendingBoxItem(null);
    setShowAccompagnementSelector(false);
    hasProcessedSelection.current = false;
  };

  // Fonction pour gérer la sélection d'une boisson offerte
  const handleBoissonSelected = (boisson: MenuItem) => {
    console.log("🍹 Boisson sélectionnée:", boisson.name);
    
    // Ajouter la boisson au panier avec prix 0 (offerte)
    const freeBoisson = {
      ...boisson,
      price: 0,
      originalPrice: boisson.price,
      id: `boisson-offerte-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    addItem(freeBoisson, 1, "Boisson offerte avec dessert");
    
    // Fermer le popup et désactiver l'offre
    setShowBoissonSelector(false);
    deactivateOffer();
    
    // Toast de confirmation
    toast({
      title: "🍹 Boisson offerte ajoutée !",
      description: `${boisson.name} a été ajoutée gratuitement à votre panier !`,
      duration: 5000,
    });
  };

  const handleCloseBoissonSelector = () => {
    console.log("🍹 Fermeture du popup boisson sans sélection");
    setShowBoissonSelector(false);
    deactivateOffer();
  };

  // Fonction pour déclencher l'offre boisson quand un dessert est ajouté
  const triggerBoissonOffer = (dessert: MenuItem) => {
    if (dessertBoissonOfferActive) {
      console.log("🍰 Déclenchement offre boisson pour dessert:", dessert.name);
      setPendingDessertForBoisson(dessert);
      setShowBoissonSelector(true);
    }
  };

  // Fonction pour gérer la sélection d'un dessert dans l'offre gourmande
  const handleDessertSelectedForOffer = (dessert: MenuItem) => {
    console.log("🍰 Dessert sélectionné pour l'offre:", dessert.name);
    
    // Ajouter le dessert au panier (payant)
    addItem(dessert, 1);
    
    // Déclencher le popup boisson via le contexte
    selectDessert(dessert);
  };

  return {
    showAccompagnementSelector,
    handleAddToCart,
    handleAccompagnementSelected,
    handleCloseAccompagnementSelector,
    pendingBoxItem,
    showBoissonSelector,
    handleBoissonSelected,
    handleCloseBoissonSelector,
    handleDessertSelectedForOffer,
    triggerBoissonOffer,
    dessertBoissonOfferActive,
    pendingDessertForBoisson
  };
};