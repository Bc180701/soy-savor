import { useState } from "react";
import { MenuItem } from "@/types";
import { useCart } from "./use-cart";
import { useBoxAccompagnement } from "./useBoxAccompagnement";
import { toast } from "./use-toast";

export const useWrapSelection = () => {
  const [isWrapModalOpen, setIsWrapModalOpen] = useState(false);
  const [pendingWrapBoxItem, setPendingWrapBoxItem] = useState<MenuItem | null>(null);
  const cart = useCart();
  
  // Utiliser le hook des accompagnements pour déclencher la modale après sélection du wrap
  const { handleAddToCart: handleBoxAddToCart } = useBoxAccompagnement();

  // Détecter si un item est une "Wrap Box"
  const isWrapBoxItem = (item: MenuItem): boolean => {
    const name = item.name.toLowerCase();
    return name.includes('wrap box') || name.includes('wrapbox') || name.includes('box wrap');
  };

  // Fonction pour gérer l'ajout au panier avec détection de Wrap Box
  const handleAddToCartWithWrapSelection = (item: MenuItem, quantity: number = 1, specialInstructions?: string) => {
    if (isWrapBoxItem(item)) {
      // Ouvrir la modale de sélection de wrap
      setPendingWrapBoxItem(item);
      setIsWrapModalOpen(true);
    } else {
      // Ajouter directement au panier
      cart.addItem(item, quantity, specialInstructions);
    }
  };

  // Fonction pour confirmer la sélection de wrap
  const handleWrapSelected = (selectedWrap: MenuItem) => {
    if (pendingWrapBoxItem) {
      // Créer un item personnalisé basé sur le wrap sélectionné
      const customWrapBoxItem: MenuItem = {
        ...pendingWrapBoxItem,
        name: `Wrap Box - ${selectedWrap.name}`,
        description: `Wrap Box contenant: ${selectedWrap.name}. ${pendingWrapBoxItem.description || ''}`,
        // Garder le prix de la Wrap Box originale
        price: pendingWrapBoxItem.price,
        category: pendingWrapBoxItem.category
      };
      
      // Fermer la modale de sélection de wrap
      setIsWrapModalOpen(false);
      setPendingWrapBoxItem(null);
      
      // 🎯 DÉCLENCHER LA MODALE DES ACCOMPAGNEMENTS GRATUITS
      console.log("🟨 Déclenchement de la modale des accompagnements gratuits...");
      handleBoxAddToCart(customWrapBoxItem, 1);
    }
  };

  // Fonction pour annuler la sélection
  const handleWrapSelectionCancel = () => {
    setIsWrapModalOpen(false);
    setPendingWrapBoxItem(null);
  };

  return {
    isWrapModalOpen,
    pendingWrapBoxItem,
    handleAddToCartWithWrapSelection,
    handleWrapSelected,
    handleWrapSelectionCancel,
    isWrapBoxItem
  };
};
