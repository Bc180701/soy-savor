import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from "@/hooks/use-toast";

interface DessertBoissonOfferContextType {
  hasSelectedFreeAccompagnement: boolean;
  dessertBoissonOfferActive: boolean;
  showOffreGourmande: boolean;
  showDessertSelector: boolean;
  showBoissonSelector: boolean;
  setHasSelectedFreeAccompagnement: (value: boolean) => void;
  setDessertBoissonOfferActive: (value: boolean) => void;
  setShowOffreGourmande: (value: boolean) => void;
  setShowDessertSelector: (value: boolean) => void;
  setShowBoissonSelector: (value: boolean) => void;
  activateOffer: () => void;
  deactivateOffer: () => void;
  acceptGourmetOffer: () => void;
  declineGourmetOffer: () => void;
  selectDessert: (dessert: any) => void;
}

const DessertBoissonOfferContext = createContext<DessertBoissonOfferContextType | undefined>(undefined);

interface DessertBoissonOfferProviderProps {
  children: ReactNode;
}

export const DessertBoissonOfferProvider = ({ children }: DessertBoissonOfferProviderProps) => {
  const [hasSelectedFreeAccompagnement, setHasSelectedFreeAccompagnement] = useState(false);
  const [dessertBoissonOfferActive, setDessertBoissonOfferActive] = useState(false);
  const [showOffreGourmande, setShowOffreGourmande] = useState(false);
  const [showDessertSelector, setShowDessertSelector] = useState(false);
  const [showBoissonSelector, setShowBoissonSelector] = useState(false);

  const activateOffer = () => {
    console.log("🎉 Activation de l'offre dessert/boisson !");
    setHasSelectedFreeAccompagnement(true);
    setDessertBoissonOfferActive(true);
    
    // Notification immédiate de l'offre débloquée
    toast({
      title: "🎉 Offre spéciale débloquée !",
      description: "Voulez-vous profiter de l'offre gourmande ?",
      duration: 5000,
    });

    // 🍰 AFFICHAGE DU POPUP OFFRE GOURMANDE APRÈS 0.5 SECONDES
    setTimeout(() => {
      console.log("🍰 Affichage du popup offre gourmande après 0.5 secondes");
      setShowOffreGourmande(true);
    }, 500);
  };

  const acceptGourmetOffer = () => {
    console.log("🍰 Utilisateur accepte l'offre gourmande");
    setShowOffreGourmande(false);
    setShowDessertSelector(true);
  };

  const declineGourmetOffer = () => {
    console.log("❌ Utilisateur refuse l'offre gourmande");
    setShowOffreGourmande(false);
    deactivateOffer();
  };

  const selectDessert = (dessert: any) => {
    console.log("🍰 Dessert sélectionné, déclenchement du popup boisson");
    setShowDessertSelector(false);
    
    // Toast pour indiquer que la boisson arrive
    toast({
      title: "🍹 Boisson offerte !",
      description: "Choisissez votre boisson gratuite !",
      duration: 3000,
    });
    
    // Afficher le popup boisson immédiatement
    setTimeout(() => {
      console.log("🍹 Affichage du popup boisson offerte");
      setShowBoissonSelector(true);
    }, 100);
  };

  const deactivateOffer = () => {
    console.log("🔚 Désactivation de l'offre dessert/boisson");
    setDessertBoissonOfferActive(false);
    setShowOffreGourmande(false);
    setShowDessertSelector(false);
    setShowBoissonSelector(false);
  };

  const value = {
    hasSelectedFreeAccompagnement,
    dessertBoissonOfferActive,
    showOffreGourmande,
    showDessertSelector,
    showBoissonSelector,
    setHasSelectedFreeAccompagnement,
    setDessertBoissonOfferActive,
    setShowOffreGourmande,
    setShowDessertSelector,
    setShowBoissonSelector,
    activateOffer,
    deactivateOffer,
    acceptGourmetOffer,
    declineGourmetOffer,
    selectDessert
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