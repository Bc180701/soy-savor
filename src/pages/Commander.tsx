
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem, MenuCategory } from "@/types";
import { getMenuData, initializeCategories, initializeFullMenu } from "@/services/productService";
import { RESTAURANTS } from "@/services/restaurantService";
import { isRestaurantOpenNow, getNextOpenDay } from "@/services/openingHoursService";
import { supabase } from "@/integrations/supabase/client";
import { RestaurantProvider, useRestaurantContext } from "@/hooks/useRestaurantContext";
import { Restaurant } from "@/types/restaurant";
import LoadingSpinner from "@/components/menu/LoadingSpinner";
import RestaurantClosedMessage from "@/components/menu/RestaurantClosedMessage";
import OrderingLockedMessage from "@/components/menu/OrderingLockedMessage";
import PromotionalBanner from "@/components/menu/PromotionalBanner";
import CategorySection from "@/components/menu/CategorySection";
import ProductsDisplay from "@/components/menu/ProductsDisplay";
import RestaurantSelectionDialog from "@/components/menu/RestaurantSelectionDialog";

const CommanderContent = () => {
  const { toast } = useToast();
  const cart = useCart();
  const { isOrderingLocked } = useCart();
  const { currentRestaurant, setCurrentRestaurant } = useRestaurantContext();
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

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();
    
    // Vérifier si le restaurant est ouvert maintenant
    const checkOpeningHours = async () => {
      const isOpen = await isRestaurantOpenNow();
      setIsRestaurantOpen(isOpen);
      
      if (!isOpen) {
        const nextDay = await getNextOpenDay();
        setNextOpenDay(nextDay);
      }
    };
    
    checkOpeningHours();

    // Afficher le dialog de sélection de restaurant si aucun restaurant n'est sélectionné
    if (!currentRestaurant) {
      setShowRestaurantDialog(true);
      setIsLoading(false);
    }
  }, []);

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
  }, [currentRestaurant?.id, toast]); // Ajouter currentRestaurant.id comme dépendance

  const handleRestaurantSelected = (restaurant: Restaurant) => {
    console.log("🏪 Nouveau restaurant sélectionné:", restaurant.name);
    setCurrentRestaurant(restaurant);
    // Les états seront réinitialisés par l'effet ci-dessus
  };

  const addToCart = (item: MenuItem) => {
    cart.addItem(item, 1);
    
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
  };

  // Si les commandes sont verrouillées, afficher un message au lieu du menu
  if (isOrderingLocked) {
    return <OrderingLockedMessage />;
  }
  
  // Si le restaurant est fermé aujourd'hui
  if (!isRestaurantOpen && nextOpenDay) {
    return <RestaurantClosedMessage nextOpenDay={nextOpenDay} />;
  }

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

  console.log("🖼️ Rendu final - Catégories non vides:", nonEmptyCategories.length);

  return (
    <div className="container mx-auto py-24 px-4">
      <RestaurantSelectionDialog
        open={showRestaurantDialog}
        onOpenChange={setShowRestaurantDialog}
        onRestaurantSelected={handleRestaurantSelected}
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
                  onAddToCart={addToCart}
                  categoryRefs={categoryRefs}
                />
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

const Commander = () => {
  return (
    <RestaurantProvider>
      <CommanderContent />
    </RestaurantProvider>
  );
};

export default Commander;
