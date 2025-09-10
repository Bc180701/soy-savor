import { useState, useRef } from "react";
import { MenuItem } from "@/types";
import { useCartWithRestaurant } from "./useCartWithRestaurant";
import { toast } from "@/hooks/use-toast";
import { useDessertBoissonOffer } from "./useDessertBoissonOffer";

export const useBoxAccompagnement = () => {
  const [showAccompagnementSelector, setShowAccompagnementSelector] = useState(false);
  const [pendingBoxItem, setPendingBoxItem] = useState<{
    item: MenuItem;
    quantity: number;
    specialInstructions?: string;
  } | null>(null);
  
  // États pour l'offre dessert/boisson en cascade - MAINTENANT GLOBAL
  const { activateOffer, deactivateOffer, dessertBoissonOfferActive } = useDessertBoissonOffer();
  const [showBoissonSelector, setShowBoissonSelector] = useState(false);
  const [pendingDessertForBoisson, setPendingDessertForBoisson] = useState<MenuItem | null>(null);
  
  // Flag pour éviter la double exécution lors de la fermeture du popup
  const hasProcessedSelection = useRef(false);
  
  const { addItem, checkDessertForBoissonOffer } = useCartWithRestaurant();

  // Vérifier si c'est après 14h
  const isAfter2PM = () => {
    const now = new Date();
    return now.getHours() >= 14;
  };

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
      
      // ✨ ACTIVATION DE L'OFFRE DESSERT/BOISSON EN CASCADE
      activateOffer();
      
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

  // Gestion de la sélection de boisson offerte
  const handleBoissonSelected = (boisson: MenuItem) => {
    console.log("🍹 Boisson offerte sélectionnée:", boisson.name);
    
    // Ajouter la boisson gratuite au panier
    addItem({
      ...boisson,
      id: `boisson-offerte-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }, 1, "Boisson offerte avec dessert");
    
    // Désactiver l'offre (une seule fois par commande)
    deactivateOffer();
    setShowBoissonSelector(false);
    setPendingDessertForBoisson(null);
    
    toast({
      title: "🍹 Boisson ajoutée !",
      description: `${boisson.name} offerte ajoutée à votre commande`,
    });
  };

  const handleCloseBoissonSelector = () => {
    console.log("🍹 Fermeture du popup boisson offerte");
    setShowBoissonSelector(false);
    setPendingDessertForBoisson(null);
  };

  // Fonction pour déclencher l'offre boisson quand un dessert est ajouté
  const triggerBoissonOffer = (dessert: MenuItem) => {
    if (dessertBoissonOfferActive) {
      console.log("🍰 Déclenchement offre boisson pour dessert:", dessert.name);
      setPendingDessertForBoisson(dessert);
      setShowBoissonSelector(true);
    }
  };

  return {
    showAccompagnementSelector,
    handleAddToCart,
    handleAccompagnementSelected,
    handleCloseAccompagnementSelector,
    pendingBoxItem,
    // Nouveaux états et fonctions pour l'offre dessert/boisson
    showBoissonSelector,
    handleBoissonSelected,
    handleCloseBoissonSelector,
    triggerBoissonOffer,
    pendingDessertForBoisson
  };
};