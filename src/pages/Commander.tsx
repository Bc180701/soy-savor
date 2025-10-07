import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { MenuItem, MenuCategory } from "@/types";
import { getMenuData, initializeCategories, initializeFullMenu } from "@/services/productService";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext, RestaurantProvider } from "@/hooks/useRestaurantContext";
import { Restaurant } from "@/types/restaurant";
import { isRestaurantOpenNow, getNextOpenDay } from "@/services/openingHoursService";
import LoadingSpinner from "@/components/menu/LoadingSpinner";
import RestaurantClosedMessage from "@/components/menu/RestaurantClosedMessage";
import OrderingLockedMessage from "@/components/menu/OrderingLockedMessage";
import PromotionalBanner from "@/components/menu/PromotionalBanner";
import CategorySection from "@/components/menu/CategorySection";
import ProductsDisplay from "@/components/menu/ProductsDisplay";
import RestaurantSelectionDialog from "@/components/menu/RestaurantSelectionDialog";
import RestaurantStatusBanner from "@/components/menu/RestaurantStatusBanner";
import { useCart } from "@/hooks/use-cart";
import { useCartWithRestaurant } from "@/hooks/useCartWithRestaurant";
import { useBoxAccompagnement } from "@/hooks/useBoxAccompagnement";
import { useDessertBoissonOffer, DessertBoissonOfferProvider } from "@/hooks/useDessertBoissonOffer";
import { AccompagnementSelector } from "@/components/AccompagnementSelector";
import { BoissonOfferteSelector } from "@/components/BoissonOfferteSelector";
import { OffreGourmandeSelector } from "@/components/OffreGourmandeSelector";
import { DessertSelector } from "@/components/DessertSelector";
import SEOHead from "@/components/SEOHead";
import commanderHeroImage from "@/assets/commander-hero.jpg";

import { useOrderingLockStatus } from "@/hooks/useOrderingLockStatus";

const CommanderContent = () => {
  const { toast } = useToast();
  const location = useLocation();
  const { addItem: addToCart, checkRestaurantCompatibility, clearCart, selectedRestaurantId, checkDessertForBoissonOffer } = useCartWithRestaurant();
  const { setOrderingLocked } = useCart();
  const { isOrderingLocked, isLoading: isOrderingStatusLoading } = useOrderingLockStatus();
  const { currentRestaurant, setCurrentRestaurant } = useRestaurantContext();
  
  // Hook pour gérer l'offre box avec accompagnement
  const {
    showAccompagnementSelector,
    handleAddToCart: handleBoxAddToCart,
    handleAccompagnementSelected,
    handleCloseAccompagnementSelector,
    pendingBoxItem,
    handleBoissonSelected,
    handleCloseBoissonSelector,
    handleDessertSelectedForOffer,
    triggerBoissonOffer,
    dessertBoissonOfferActive,
    pendingDessertForBoisson
  } = useBoxAccompagnement();

  // Utiliser le contexte global pour l'offre dessert/boisson
  const { 
    showOffreGourmande, 
    showDessertSelector, 
    showBoissonSelector,
    acceptGourmetOffer,
    declineGourmetOffer
  } = useDessertBoissonOffer();
  const [showRestaurantDialog, setShowRestaurantDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean>(true);
  const [nextOpenDay, setNextOpenDay] = useState<any>(null);
  const [isCategoryChanging, setIsCategoryChanging] = useState(false);
  const [visibleSections, setVisibleSections] = useState<{[key: string]: boolean}>({});
  const categoryRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [preselectedRestaurantId, setPreselectedRestaurantId] = useState<string | null>(null);

  // Récupérer le restaurant pré-sélectionné depuis l'état de navigation
  useEffect(() => {
    const state = location.state as { preselectedRestaurantId?: string };
    if (state?.preselectedRestaurantId) {
      setPreselectedRestaurantId(state.preselectedRestaurantId);
      // Nettoyer l'état pour éviter de le réutiliser
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();

    // Toujours afficher le dialog de sélection de restaurant au début
    // Ne pas dépendre de currentRestaurant pour décider
    setShowRestaurantDialog(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Vérifier si le restaurant sélectionné est ouvert maintenant
    const checkOpeningHours = async () => {
      if (!currentRestaurant) return;
      
      const isOpen = await isRestaurantOpenNow(currentRestaurant.id);
      setIsRestaurantOpen(isOpen);
      
      if (!isOpen) {
        const nextDay = await getNextOpenDay(currentRestaurant.id);
        setNextOpenDay(nextDay);
      }
    };
    
    if (currentRestaurant) {
      checkOpeningHours();
    }
  }, [currentRestaurant]);

  useEffect(() => {
    if (!currentRestaurant) return;

    const loadMenuData = async () => {
      console.log("🔄 Début du chargement du menu pour:", currentRestaurant.name);
      setIsLoading(true);
      setCategories([]); // Réinitialiser les catégories pour éviter l'affichage de données obsolètes
      setActiveCategory(""); // Réinitialiser la catégorie active
      
      try {
        console.log("Chargement des données du menu pour le restaurant:", currentRestaurant.name);
        console.time('Loading Menu Data');
        
        // Charger les données du menu pour le restaurant sélectionné
        let menuData = await getMenuData(currentRestaurant.id);
        console.timeEnd('Loading Menu Data');
        console.log("📋 Données reçues:", menuData.length, "catégories");
        
        // Si aucune donnée n'existe, initialiser automatiquement
        if (menuData.length === 0) {
          console.log("Aucune donnée de menu trouvée, initialisation automatique...");
          setIsInitializing(true);
          
          // D'abord initialiser les catégories
          console.log("Initialisation des catégories...");
          const categoriesInitialized = await initializeCategories(currentRestaurant.id);
          if (!categoriesInitialized) {
            throw new Error("Échec de l'initialisation des catégories");
          }
          console.log("Catégories initialisées avec succès");
          
          // Ensuite, initialiser les produits complets
          console.log("Initialisation des produits...");
          const productsInitialized = await initializeFullMenu(currentRestaurant.id);
          if (!productsInitialized) {
            throw new Error("Échec de l'initialisation des produits");
          }
          console.log("Produits initialisés avec succès");
          
          // Récupérer les données du menu après l'initialisation
          menuData = await getMenuData(currentRestaurant.id);
          
          toast({
            title: "Menu initialisé",
            description: `Les catégories et produits ont été chargés avec succès pour ${currentRestaurant.name}.`,
          });
          
          setIsInitializing(false);
        }
        
        // Filtrer les produits actifs dans chaque catégorie
        const filteredCategories = menuData.map(category => ({
          ...category,
          items: category.items.filter(item => item.isNew !== false)
        }));
        
        console.log("✅ Catégories filtrées:", filteredCategories.map(cat => 
          `${cat.name}: ${cat.items.length} produits`
        ));
        
        // Mettre à jour les catégories
        setCategories(filteredCategories);
        
        // Set the active category to the first one if available
        if (filteredCategories.length > 0) {
          const firstCategory = filteredCategories[0];
          console.log("🎯 Catégorie active définie sur:", firstCategory.name);
          setActiveCategory(firstCategory.id);
        }
        
        console.log("🎉 Chargement du menu terminé avec succès");
      } catch (error) {
        console.error("❌ Error loading menu data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du menu. Vérifiez les autorisations de la base de données.",
          variant: "destructive"
        });
        // En cas d'erreur, s'assurer que les catégories sont vides
        setCategories([]);
        setActiveCategory("");
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuData();
  }, [currentRestaurant?.id, toast]);

  const handleRestaurantSelected = (restaurant: Restaurant) => {
    console.log("🏪 Nouveau restaurant sélectionné:", restaurant.name, "ID:", restaurant.id);
    console.log("🏪 Restaurant actuel avant changement:", currentRestaurant?.name, "ID:", currentRestaurant?.id);
    
    // Vérifier si le panier est compatible avec le nouveau restaurant
    const isCompatible = checkRestaurantCompatibility(restaurant.id);
    
    if (!isCompatible) {
      console.log("⚠️ Changement de restaurant détecté, le panier va être vidé");
      toast({
        title: "Panier vidé",
        description: `Votre panier a été vidé car vous avez changé de restaurant.`,
        variant: "default"
      });
      clearCart();
    }
    
    setCurrentRestaurant(restaurant);
    console.log("🏪 setCurrentRestaurant appelé avec:", restaurant.name, "ID:", restaurant.id);
    // Les états seront réinitialisés par l'effet ci-dessus
  };

  const handleAddToCart = (item: MenuItem) => {
    console.log("🛒 Tentative d'ajout au panier:", item.name, "Restaurant:", currentRestaurant?.name);
    
    if (isOrderingLocked) {
      toast({
        title: "Commandes verrouillées",
        description: "Ce restaurant n'accepte pas de nouvelles commandes pour le moment.",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentRestaurant) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un restaurant avant d'ajouter des articles au panier.",
        variant: "destructive"
      });
      return;
    }

    // Vérifier la compatibilité avant d'ajouter
    if (!checkRestaurantCompatibility(currentRestaurant.id)) {
      console.log("⚠️ Restaurant incompatible détecté lors de l'ajout");
      toast({
        title: "Panier vidé",
        description: "Votre panier contenait des articles d'un autre restaurant et a été vidé.",
        variant: "default"
      });
      clearCart();
    }

    // 🍰 Vérifier si c'est un dessert ET si l'offre boisson est active
    if (checkDessertForBoissonOffer(item) && dessertBoissonOfferActive) {
      console.log("🍰 Dessert détecté avec offre boisson active:", item.name);
      // Ajouter le dessert d'abord
      addToCart(item, 1);
      // Puis déclencher l'offre boisson
      triggerBoissonOffer(item);
      
      toast({
        title: "Dessert ajouté !",
        description: `${item.name} ajouté. Choisissez votre boisson offerte !`,
      });
      return;
    }

    // 📦 Gérer les box avec la logique d'accompagnement
    handleBoxAddToCart(item, 1);
    
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
  };

  useEffect(() => {
    setOrderingLocked(isOrderingLocked);
  }, [isOrderingLocked, setOrderingLocked]);

  // Si les commandes sont verrouillées, afficher un message au lieu du menu
  if (isOrderingStatusLoading || isOrderingLocked) {
    return <OrderingLockedMessage />;
  }
  
  // Note: On supprime la vérification qui bloque l'accès au menu quand le restaurant est fermé
  // Les clients peuvent maintenant commander 24h/24 pour les créneaux d'ouverture du jour

  // Afficher uniquement le chargement initial, pas lors des changements de catégorie
  if ((isLoading && categories.length === 0) || isInitializing) {
    return (
      <LoadingSpinner 
        message={isInitializing ? "Initialisation du menu..." : "Chargement du menu..."}
      />
    );
  }

  // Filtrer les catégories pour n'afficher que celles qui contiennent des produits
  const nonEmptyCategories = categories.filter(cat => cat.items.length > 0);

  // Debug logs supprimés pour éviter le spam console

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Commander en ligne",
    "description": "Commandez vos sushis et spécialités japonaises en ligne. Livraison rapide et click & collect disponibles.",
    "provider": {
      "@type": "Restaurant",
      "name": "Sushieats",
      "servesCuisine": "Japonaise"
    }
  };

  return (
    <>
      <SEOHead 
        title="Commander Sushi en Ligne - Livraison Rapide | Sushieats"
        description="Commandez vos sushis, makis et poke bowls en ligne. Livraison rapide à domicile ou click & collect dans nos restaurants. Paiement sécurisé."
        keywords="commander sushi, livraison sushi, click and collect, commande en ligne, livraison rapide, paiement sécurisé"
        canonical={`${window.location.origin}/commander`}
        ogImage={commanderHeroImage}
        ogType="website"
        structuredData={structuredData}
      />

      
      <div className="container mx-auto py-24 px-4">
        <RestaurantSelectionDialog
          open={showRestaurantDialog}
          onOpenChange={setShowRestaurantDialog}
          onRestaurantSelected={handleRestaurantSelected}
          preselectedRestaurantId={preselectedRestaurantId}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-center mb-2">Commander</h1>
          <p className="text-gray-600 text-center mb-8">
            Commandez en ligne et récupérez votre repas dans notre restaurant
          </p>

        {currentRestaurant && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <span className="text-sm text-gray-600">Restaurant sélectionné:</span>
              <span className="font-semibold">{currentRestaurant.name}</span>
              <button
                onClick={() => setShowRestaurantDialog(true)}
                className="text-blue-600 hover:text-blue-800 text-sm underline ml-2"
              >
                Changer
              </button>
            </div>
          </div>
        )}

        {/* Bannière de statut du restaurant - seulement si un restaurant est sélectionné */}
        {currentRestaurant && <RestaurantStatusBanner />}

        {!currentRestaurant ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">Veuillez sélectionner un restaurant pour voir le menu.</p>
            <button
              onClick={() => setShowRestaurantDialog(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choisir un restaurant
            </button>
          </div>
        ) : (
          <>
            {!isAuthenticated && <PromotionalBanner />}

            {nonEmptyCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600">Aucun produit disponible actuellement pour {currentRestaurant.name}.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Rafraîchir la page
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                <CategorySection
                  categories={nonEmptyCategories}
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  isCategoryChanging={isCategoryChanging}
                  setIsCategoryChanging={setIsCategoryChanging}
                  setActiveCategory={setActiveCategory}
                  setVisibleSections={setVisibleSections}
                  categoryRefs={categoryRefs}
                />
                
                <ProductsDisplay
                  categories={nonEmptyCategories}
                  onAddToCart={handleAddToCart}
                  categoryRefs={categoryRefs}
                />
              </div>
            )}
          </>
        )}
        </motion.div>
      </div>

        {/* Popup de sélection d'accompagnement pour les box */}
        <AccompagnementSelector
          isOpen={showAccompagnementSelector}
          onClose={handleCloseAccompagnementSelector}
          onAccompagnementSelected={handleAccompagnementSelected}
          restaurantId={currentRestaurant?.id}
        />

        {/* Popup d'offre gourmande */}
        {showOffreGourmande && (
          <OffreGourmandeSelector
            isOpen={showOffreGourmande}
            onClose={declineGourmetOffer}
            onAcceptOffer={acceptGourmetOffer}
            onDeclineOffer={declineGourmetOffer}
          />
        )}

        {/* Popup de sélection de dessert */}
        {showDessertSelector && (
          <DessertSelector
            isOpen={showDessertSelector}
            onClose={() => {
              // Ne pas désactiver l'offre quand on ferme le popup dessert
              // car on veut pouvoir afficher ensuite le popup boisson
            }}
            onDessertSelected={handleDessertSelectedForOffer}
          />
        )}

        {/* Popup de sélection de boisson offerte */}
        <BoissonOfferteSelector
          isOpen={showBoissonSelector}
          onClose={handleCloseBoissonSelector}
          onBoissonSelected={handleBoissonSelected}
          restaurantId={currentRestaurant?.id}
        />
    </>
  );
};

const Commander = () => {
  return (
    <RestaurantProvider>
      <DessertBoissonOfferProvider>
        <CommanderContent />
      </DessertBoissonOfferProvider>
    </RestaurantProvider>
  );
};

export default Commander;
