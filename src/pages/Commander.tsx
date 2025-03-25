
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem, MenuCategory } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMenuData } from "@/services/productService";
import MobileCategorySelector from "@/components/menu/MobileCategorySelector";
import DesktopCategorySelector from "@/components/menu/DesktopCategorySelector";
import CategoryContent from "@/components/menu/CategoryContent";

const Commander = () => {
  const { toast } = useToast();
  const cart = useCart();
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenuData = async () => {
      setIsLoading(true);
      try {
        const menuData = await getMenuData();
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

    // Seulement charger les données si les catégories sont vides
    if (categories.length === 0) {
      fetchMenuData();
    }
  }, [toast]); // Suppression de la dépendance activeCategory

  const addToCart = (item: MenuItem) => {
    cart.addItem(item, 1);
    
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-akane-600" />
        <span className="ml-2">Chargement du menu...</span>
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
        <p className="text-gray-600 text-center mb-12">
          Commandez en ligne et récupérez votre repas dans notre restaurant
        </p>

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
