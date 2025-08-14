import { useState } from "react";
import { MenuItem } from "@/types";
import { useCart } from "./use-cart";

export const useBoxAccompagnement = () => {
  const [showAccompagnementSelector, setShowAccompagnementSelector] = useState(false);
  const [pendingBoxItem, setPendingBoxItem] = useState<{
    item: MenuItem;
    quantity: number;
    specialInstructions?: string;
  } | null>(null);
  
  const cart = useCart();

  const isBoxItem = (item: MenuItem) => {
    return item.category === 'box' || 
           item.category === 'box_du_midi' || 
           item.category.toLowerCase().includes('box') ||
           item.name.toLowerCase().includes('box');
  };

  const handleAddToCart = (item: MenuItem, quantity: number = 1, specialInstructions?: string) => {
    if (isBoxItem(item)) {
      // Si c'est une box, ouvrir le popup de sélection d'accompagnement
      setPendingBoxItem({ item, quantity, specialInstructions });
      setShowAccompagnementSelector(true);
    } else {
      // Sinon, ajouter directement au panier
      cart.addItem(item, quantity, specialInstructions);
    }
  };

  const handleAccompagnementSelected = (accompagnement: MenuItem) => {
    if (pendingBoxItem) {
      // Ajouter la box au panier
      cart.addItem(pendingBoxItem.item, pendingBoxItem.quantity, pendingBoxItem.specialInstructions);
      
      // Ajouter l'accompagnement gratuit avec instruction spéciale
      cart.addItem({
        ...accompagnement,
        id: `accompagnement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }, 1, "Accompagnement offert avec box");
      
      // Nettoyer les états
      setPendingBoxItem(null);
      setShowAccompagnementSelector(false);
    }
  };

  const handleCloseAccompagnementSelector = () => {
    if (pendingBoxItem) {
      // Si l'utilisateur ferme le popup, ajouter quand même la box sans accompagnement
      cart.addItem(pendingBoxItem.item, pendingBoxItem.quantity, pendingBoxItem.specialInstructions);
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