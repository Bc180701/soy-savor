import { useState, useRef } from "react";
import { MenuItem } from "@/types";
import { useCartWithRestaurant } from "./useCartWithRestaurant";

export const useBoxAccompagnement = () => {
  const [showAccompagnementSelector, setShowAccompagnementSelector] = useState(false);
  const [pendingBoxItem, setPendingBoxItem] = useState<{
    item: MenuItem;
    quantity: number;
    specialInstructions?: string;
  } | null>(null);
  
  // Flag pour éviter la double exécution lors de la fermeture du popup
  const hasProcessedSelection = useRef(false);
  
  const { addItem } = useCartWithRestaurant();

  const isBoxItem = (item: MenuItem) => {
    return item.category === 'box' || 
           item.category === 'box_du_midi' || 
           item.category.toLowerCase().includes('box') ||
           item.name.toLowerCase().includes('box');
  };

  const handleAddToCart = (item: MenuItem, quantity: number = 1, specialInstructions?: string) => {
    console.log("🟦 useBoxAccompagnement.handleAddToCart called with:", item.name);
    if (isBoxItem(item)) {
      console.log("🟦 C'est une box, ouverture du popup pour:", item.name);
      // Réinitialiser le flag à chaque ouverture du popup
      hasProcessedSelection.current = false;
      // Si c'est une box, ouvrir le popup de sélection d'accompagnement SANS ajouter encore la box
      setPendingBoxItem({ item, quantity, specialInstructions });
      setShowAccompagnementSelector(true);
    } else {
      console.log("🟦 Pas une box, ajout direct:", item.name);
      // Sinon, ajouter directement au panier
      addItem(item, quantity, specialInstructions);
    }
  };

  const handleAccompagnementSelected = (accompagnement: MenuItem) => {
    console.log("🟦 Accompagnement sélectionné:", accompagnement.name);
    if (pendingBoxItem) {
      console.log("🟦 Ajout de la box au panier:", pendingBoxItem.item.name);
      // Marquer qu'on a traité la sélection pour éviter la double exécution
      hasProcessedSelection.current = true;
      
      // Ajouter la box au panier
      addItem(pendingBoxItem.item, pendingBoxItem.quantity, pendingBoxItem.specialInstructions);
      
      console.log("🟦 Ajout de l'accompagnement gratuit:", accompagnement.name);
      // Ajouter l'accompagnement gratuit avec instruction spéciale
      addItem({
        ...accompagnement,
        id: `accompagnement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }, 1, "Accompagnement offert avec box");
      
      // Nettoyer les états
      setPendingBoxItem(null);
      setShowAccompagnementSelector(false);
    }
  };

  const handleCloseAccompagnementSelector = () => {
    console.log("🟦 Fermeture du popup d'accompagnement");
    // Vérifier si on a déjà traité une sélection pour éviter la duplication
    if (pendingBoxItem && !hasProcessedSelection.current) {
      console.log("🟦 Ajout de la box sans accompagnement:", pendingBoxItem.item.name);
      // Si l'utilisateur ferme le popup, ajouter quand même la box sans accompagnement
      addItem(pendingBoxItem.item, pendingBoxItem.quantity, pendingBoxItem.specialInstructions);
      setPendingBoxItem(null);
    } else if (hasProcessedSelection.current) {
      console.log("🟦 Sélection déjà traitée, pas d'ajout supplémentaire");
    }
    setShowAccompagnementSelector(false);
  };

  return {
    showAccompagnementSelector,
    handleAddToCart,
    handleAccompagnementSelected,
    handleCloseAccompagnementSelector,
    pendingBoxItem
  };
};