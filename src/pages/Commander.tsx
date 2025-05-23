import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Ban, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem, MenuCategory } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { getMenuData, initializeCategories, initializeFullMenu } from "@/services/productService";
import { isRestaurantOpenNow, getNextOpenDay } from "@/services/openingHoursService";
import MobileCategorySelector from "@/components/menu/MobileCategorySelector";
import DesktopCategorySelector from "@/components/menu/DesktopCategorySelector";
import CategoryContent from "@/components/menu/CategoryContent";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Commander = () => {
  const { toast } = useToast();
  const cart = useCart();
  const { isOrderingLocked } = useCart();
  const isMobile = useIsMobile();
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
        
        // Filtrer les produits actifs dans chaque catégorie
        const filteredCategories = menuData.map(category => ({
          ...category,
          items: category.items.filter(item => item.isNew !== false)
        }));
        
        setCategories(filteredCategories);
        
        // Set the active category to the first one if available
        if (filteredCategories.length > 0 && !activeCategory) {
          setActiveCategory(filteredCategories[0].id);
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

  // Configuration of the Intersection Observer to detect visible sections
  useEffect(() => {
    if (categories.length === 0 || isLoading) return;
    
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.3, // The section is considered visible when 30% is visible
    };
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const updatedVisibleSections = { ...visibleSections };
      
      entries.forEach((entry) => {
        const id = entry.target.id;
        updatedVisibleSections[id] = entry.isIntersecting;
      });
      
      setVisibleSections(updatedVisibleSections);
      
      // Determine which category is most visible (the one that appears first in the list)
      const visibleCategoryIds = Object.keys(updatedVisibleSections).filter(
        id => updatedVisibleSections[id]
      );
      
      if (visibleCategoryIds.length > 0 && !isCategoryChanging) {
        // Use the first visible category in the DOM order
        const firstVisibleCategoryId = visibleCategoryIds[0];
        if (firstVisibleCategoryId !== activeCategory) {
          setActiveCategory(firstVisibleCategoryId);
        }
      }
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe each category section
    Object.keys(categoryRefs.current).forEach((categoryId) => {
      const el = categoryRefs.current[categoryId];
      if (el) observer.observe(el);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [categories, isLoading, categoryRefs.current, activeCategory, visibleSections, isCategoryChanging]);

  // Function to change category and scroll to that section
  const handleCategoryChange = (categoryId: string) => {
    setIsCategoryChanging(true);
    setActiveCategory(categoryId);
    
    // Scroll to the selected category
    const element = categoryRefs.current[categoryId];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Reset the flag after scrolling is complete
      setTimeout(() => {
        setIsCategoryChanging(false);
      }, 1000); // Give enough time for scrolling to complete
    }
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
    return (
      <div className="container mx-auto py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="flex justify-center mb-6">
            <Ban size={80} className="text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Commandes Temporairement Fermées</h1>
          
          <Alert variant="destructive" className="mb-8 border-red-500">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Commandes indisponibles</AlertTitle>
            <AlertDescription>
              Nous sommes désolés, mais notre service de commande en ligne est temporairement indisponible.
              Veuillez réessayer ultérieurement ou nous contacter par téléphone.
            </AlertDescription>
          </Alert>
          
          <p className="text-gray-600 mb-8">
            Cette interruption de service peut être due à une fermeture exceptionnelle, à un jour férié, 
            ou à une maintenance technique. Nous nous excusons pour la gêne occasionnée et vous remercions 
            de votre compréhension.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            <Button asChild>
              <Link to="/contact">Nous contacter</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Si le restaurant est fermé aujourd'hui
  if (!isRestaurantOpen && nextOpenDay) {
    return (
      <div className="container mx-auto py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="flex justify-center mb-6">
            <Clock size={80} className="text-amber-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Restaurant Fermé Aujourd'hui</h1>
          
          <Alert className="mb-8 border-amber-500">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertTitle>Commandes indisponibles</AlertTitle>
            <AlertDescription>
              Notre restaurant est actuellement fermé. Nous sommes ouverts de mardi à samedi.
            </AlertDescription>
          </Alert>
          
          {nextOpenDay && (
            <p className="text-gray-600 mb-8">
              Nous serons ouverts à nouveau {getFormattedDayName(nextOpenDay.day)} de {nextOpenDay.open_time} à {nextOpenDay.close_time}.
              Nous serons ravis de vous accueillir prochainement !
            </p>
          )}
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            <Button asChild>
              <Link to="/contact">Nous contacter</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fonction auxiliaire pour formater le nom du jour
  function getFormattedDayName(day: string): string {
    const dayNames: {[key: string]: string} = {
      "monday": "lundi",
      "tuesday": "mardi", 
      "wednesday": "mercredi",
      "thursday": "jeudi",
      "friday": "vendredi",
      "saturday": "samedi",
      "sunday": "dimanche"
    };
    return dayNames[day] || day;
  }

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

        {nonEmptyCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Aucun produit disponible actuellement.</p>
          </div>
        ) : (
          <>
            {/* Show horizontal scrolling categories on mobile */}
            {isMobile && (
              <MobileCategorySelector 
                categories={nonEmptyCategories} 
                activeCategory={activeCategory} 
                onCategoryChange={handleCategoryChange} 
              />
            )}

            <div className="flex flex-col md:flex-row gap-6">
              {/* Show vertical categories sidebar on desktop */}
              {!isMobile && (
                <DesktopCategorySelector 
                  categories={nonEmptyCategories} 
                  activeCategory={activeCategory} 
                  onCategoryChange={handleCategoryChange} 
                />
              )}

              <div className={isMobile ? "w-full" : "md:w-3/4"}>
                {/* Display all categories at once to allow scrolling */}
                <div className="space-y-12">
                  {nonEmptyCategories.map((category) => (
                    <div 
                      key={category.id}
                      id={category.id}
                      ref={el => categoryRefs.current[category.id] = el}
                    >
                      <CategoryContent 
                        category={category} 
                        onAddToCart={addToCart} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Commander;
