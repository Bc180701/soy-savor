import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem, MenuCategory } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMenuData, initializeCategories, initializeFullMenu } from "@/services/productService";
import MobileCategorySelector from "@/components/menu/MobileCategorySelector";
import DesktopCategorySelector from "@/components/menu/DesktopCategorySelector";
import CategoryContent from "@/components/menu/CategoryContent";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Commander = () => {
  const { toast } = useToast();
  const cart = useCart();
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCategoryChanging, setIsCategoryChanging] = useState(false);

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
        // Utiliser la fonction optimisée qui charge tout en une seule requête
        let menuData = await getMenuData();
        console.timeEnd('Loading Menu Data');
        
        // Si aucune donnée n'existe, initialiser automatiquement
        if (menuData.length === 0) {
          console.log("Aucune donnée de menu trouvée, initialisation automatique...");
          setIsInitializing(true);
          
          // D'abord initialiser les catégories
          console.log("Initialisation des catégories...");
          const categoriesInitialized = await initializeCategories();
          if (!categoriesInitialized) {
            throw new Error("Échec de l'initialisation des catégories");
          }
          console.log("Catégories initialisées avec succès");
          
          // Ensuite, initialiser les produits complets
          console.log("Initialisation des produits...");
          const productsInitialized = await initializeFullMenu();
          if (!productsInitialized) {
            throw new Error("Échec de l'initialisation des produits");
          }
          console.log("Produits initialisés avec succès");
          
          // Récupérer les données du menu après l'initialisation
          menuData = await getMenuData();
          
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
  }, [toast, activeCategory]);

  // Fonction pour changer de catégorie sans montrer de chargement
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const addToCart = (item: MenuItem) => {
    cart.addItem(item, 1);
    
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
  };

  // Afficher uniquement le chargement initial, pas lors des changements de catégorie
  if ((isLoading && categories.length === 0) || isInitializing) {
    return (
      <div className="container mx-auto py-24 px-4 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
        <span className="ml-2">
          {isInitializing ? "Initialisation du menu..." : "Chargement du menu..."}
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
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

        {!isAuthenticated && (
          <motion.div 
            className="mb-8 bg-gradient-to-r from-gold-500 to-gold-300 p-6 rounded-lg shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Badge className="bg-white text-gold-600 mb-2">OFFRE SPÉCIALE</Badge>
            <h3 className="text-white text-xl font-bold mb-2">-10% sur votre première commande</h3>
            <p className="text-white/90 mb-4">Créez un compte maintenant pour profiter de cette promotion exclusive</p>
            <Button asChild className="bg-white hover:bg-gray-100 text-gold-600">
              <Link to="/register">Créer un compte</Link>
            </Button>
          </motion.div>
        )}

        {/* Show horizontal scrolling categories on mobile */}
        {isMobile && (
          <MobileCategorySelector 
            categories={categories} 
            activeCategory={activeCategory} 
            onCategoryChange={handleCategoryChange} 
          />
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Show vertical categories sidebar on desktop */}
          {!isMobile && (
            <DesktopCategorySelector 
              categories={categories} 
              activeCategory={activeCategory} 
              onCategoryChange={handleCategoryChange} 
            />
          )}

          <div className={isMobile ? "w-full" : "md:w-3/4"}>
            <AnimatePresence mode="wait">
              {categories.map((category) => (
                activeCategory === category.id && (
                  <motion.div 
                    key={category.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CategoryContent category={category} onAddToCart={addToCart} />
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Commander;
