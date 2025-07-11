
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { MenuCategory } from "@/types";
import { getMenuData, initializeCategories, initializeFullMenu } from "@/services/productService";
import { RESTAURANTS } from "@/services/restaurantService";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/menu/LoadingSpinner";
import PromotionalBanner from "@/components/menu/PromotionalBanner";
import CategorySection from "@/components/menu/CategorySection";
import MenuProductsDisplay from "@/components/menu/MenuProductsDisplay";
import RestaurantStatusBanner from "@/components/menu/RestaurantStatusBanner";
import { RestaurantProvider, useRestaurantContext } from "@/hooks/useRestaurantContext";

const MenuContent = () => {
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
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
    
    const loadMenuData = async () => {
      setIsLoading(true);
      try {
        console.time('Loading Menu Data');
        // Utiliser le premier restaurant par défaut si aucun n'est sélectionné
        const restaurantId = currentRestaurant?.id || RESTAURANTS.CHATEAURENARD;
        let menuData = await getMenuData(restaurantId);
        console.timeEnd('Loading Menu Data');
        
        // Si aucune donnée n'existe, initialiser automatiquement
        if (menuData.length === 0) {
          console.log("Aucune donnée de menu trouvée, initialisation automatique...");
          setIsInitializing(true);
          
          // D'abord initialiser les catégories avec l'ID du restaurant
          console.log("Initialisation des catégories...");
          const categoriesInitialized = await initializeCategories(restaurantId);
          if (!categoriesInitialized) {
            throw new Error("Échec de l'initialisation des catégories");
          }
          console.log("Catégories initialisées avec succès");
          
          // Ensuite, initialiser les produits complets
          console.log("Initialisation des produits...");
          const productsInitialized = await initializeFullMenu(restaurantId);
          if (!productsInitialized) {
            throw new Error("Échec de l'initialisation des produits");
          }
          console.log("Produits initialisés avec succès");
          
          // Récupérer les données du menu après l'initialisation
          menuData = await getMenuData(restaurantId);
          
          toast({
            title: "Menu initialisé",
            description: "Les catégories et produits ont été chargés avec succès.",
          });
          
          setIsInitializing(false);
        }
        
        setCategories(menuData);
        
        // Set the active category to the first one if available
        if (menuData.length > 0 && !activeCategory) {
          setActiveCategory(menuData[0].id);
        }
      } catch (error) {
        console.error("Error loading menu data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du menu. Vérifiez les autorisations de la base de données.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuData();
  }, [toast, activeCategory, currentRestaurant]);

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

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Notre Menu</h1>
        <p className="text-gray-600 text-center mb-8">
          Découvrez nos spécialités japonaises préparées avec soin
        </p>

        {/* Bannière de statut du restaurant */}
        <RestaurantStatusBanner />

        {!isAuthenticated && <PromotionalBanner />}

        {nonEmptyCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Aucun produit disponible actuellement.</p>
            <p className="text-sm text-gray-500 mt-2">
              Vérifiez que vos produits ont le statut "Actif" dans l'administration.
            </p>
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
            
            <MenuProductsDisplay
              categories={nonEmptyCategories}
              categoryRefs={categoryRefs}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Menu = () => {
  return (
    <RestaurantProvider>
      <MenuContent />
    </RestaurantProvider>
  );
};

export default Menu;
