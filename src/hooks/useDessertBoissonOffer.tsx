import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from "@/hooks/use-toast";

interface DessertBoissonOfferContextType {
  hasSelectedFreeAccompagnement: boolean;
  dessertBoissonOfferActive: boolean;
  showBoissonSelector: boolean;
  setHasSelectedFreeAccompagnement: (value: boolean) => void;
  setDessertBoissonOfferActive: (value: boolean) => void;
  setShowBoissonSelector: (value: boolean) => void;
  activateOffer: () => void;
  deactivateOffer: () => void;
}

const DessertBoissonOfferContext = createContext<DessertBoissonOfferContextType | undefined>(undefined);

interface DessertBoissonOfferProviderProps {
  children: ReactNode;
}

export const DessertBoissonOfferProvider = ({ children }: DessertBoissonOfferProviderProps) => {
  const [hasSelectedFreeAccompagnement, setHasSelectedFreeAccompagnement] = useState(false);
  const [dessertBoissonOfferActive, setDessertBoissonOfferActive] = useState(false);
  const [showBoissonSelector, setShowBoissonSelector] = useState(false);

  const activateOffer = () => {
    console.log("🎉 Activation de l'offre dessert/boisson !");
    setHasSelectedFreeAccompagnement(true);
    setDessertBoissonOfferActive(true);
    
    // Notification immédiate de l'offre débloquée
    toast({
      title: "🎉 Offre spéciale débloquée !",
      description: "Ajoutez un dessert et recevez une boisson soft offerte !",
      duration: 8000,
    });

    // 🍹 AFFICHAGE AUTOMATIQUE DU POPUP BOISSON APRÈS 2 SECONDES
    toast({
      title: "🍹 Boisson offerte arrive !",
      description: "Votre boisson offerte arrive dans 2 secondes...",
      duration: 2000,
    });
    
    setTimeout(() => {
      console.log("🍹 Affichage automatique du popup boisson après 2 secondes");
      setShowBoissonSelector(true);
    }, 2000);
  };

  const deactivateOffer = () => {
    console.log("🔚 Désactivation de l'offre dessert/boisson");
    setDessertBoissonOfferActive(false);
    setShowBoissonSelector(false);
  };

  const value = {
    hasSelectedFreeAccompagnement,
    dessertBoissonOfferActive,
    showBoissonSelector,
    setHasSelectedFreeAccompagnement,
    setDessertBoissonOfferActive,
    setShowBoissonSelector,
    activateOffer,
    deactivateOffer
  };

  return (
    <DessertBoissonOfferContext.Provider value={value}>
      {children}
    </DessertBoissonOfferContext.Provider>
  );
};

export const useDessertBoissonOffer = () => {
  const context = useContext(DessertBoissonOfferContext);
  if (context === undefined) {
    throw new Error('useDessertBoissonOffer must be used within a DessertBoissonOfferProvider');
  }
  return context;
};