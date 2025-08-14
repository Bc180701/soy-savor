import { useState } from "react";
import { MenuItem } from "@/types";
import { useCartWithRestaurant } from "./useCartWithRestaurant";

export const useBoxAccompagnement = () => {
  const [showAccompagnementSelector, setShowAccompagnementSelector] = useState(false);
  const [pendingBoxItem, setPendingBoxItem] = useState<{
    item: MenuItem;
    quantity: number;
    specialInstructions?: string;
  } | null>(null);
  
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
    if (pendingBoxItem) {
      console.log("🟦 Ajout de la box sans accompagnement:", pendingBoxItem.item.name);
      // Si l'utilisateur ferme le popup, ajouter quand même la box sans accompagnement
      addItem(pendingBoxItem.item, pendingBoxItem.quantity, pendingBoxItem.specialInstructions);
      setPendingBoxItem(null);
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