
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
        let menuData = await getMenuData();
        
        // Si aucune donnée n'existe, initialiser automatiquement
        if (menuData.length === 0) {
          console.log("Aucune donnée de menu trouvée, initialisation automatique...");
          setIsInitializing(true);
          
          // D'abord initialiser les catégories
          const categoriesInitialized = await initializeCategories();
          if (!categoriesInitialized) {
            throw new Error("Échec de l'initialisation des catégories");
          }
          
          // Ensuite, initialiser les produits complets
          const productsInitialized = await initializeFullMenu();
          if (!productsInitialized) {
            throw new Error("Échec de l'initialisation des produits");
          }
          
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
          description: "Impossible de charger les données du menu.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuData();
  }, [toast, activeCategory]);

  const addToCart = (item: MenuItem) => {
    cart.addItem(item, 1);
    
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
  };

  if (isLoading || isInitializing) {
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
            onCategoryChange={setActiveCategory} 
          />
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Show vertical categories sidebar on desktop */}
          {!isMobile && (
            <DesktopCategorySelector 
              categories={categories} 
              activeCategory={activeCategory} 
              onCategoryChange={setActiveCategory} 
            />
          )}

          <div className={isMobile ? "w-full" : "md:w-3/4"}>
            {categories.map((category) => (
              <div 
                key={category.id} 
                className={activeCategory === category.id ? "block" : "hidden"}
              >
                <CategoryContent category={category} onAddToCart={addToCart} />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Commander;
