import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { MenuCategory } from "@/types";
import { useCarteMenuData } from "@/hooks/useCarteMenuData";
import { initializeCategories, initializeFullMenu } from "@/services/productService";
import { RESTAURANTS } from "@/services/restaurantService";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/menu/LoadingSpinner";
import PromotionalBanner from "@/components/menu/PromotionalBanner";
import CategorySection from "@/components/menu/CategorySection";
import MenuProductsDisplay from "@/components/menu/MenuProductsDisplay";
import RestaurantStatusBanner from "@/components/menu/RestaurantStatusBanner";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import SEOHead from "@/components/SEOHead";
import menuHeroImage from "@/assets/carte-hero-new.jpg";

const CarteContent = () => {
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  const [activeCategory, setActiveCategory] = useState("");
  const { categories, loading: isLoading, error, isFromCache } = useCarteMenuData();
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
  }, []);

  useEffect(() => {
    // Set the active category to the first one if available
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la carte.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Afficher uniquement le chargement initial, pas lors des changements de catégorie
  if ((isLoading && categories.length === 0) || isInitializing) {
    return (
      <LoadingSpinner 
        message={isInitializing ? "Initialisation de la carte..." : "Chargement de la carte..."}
      />
    );
  }

  // Filtrer les catégories pour n'afficher que celles qui contiennent des produits
  const nonEmptyCategories = categories.filter(cat => cat.items && cat.items.length > 0);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Carte Restaurant Sushieats",
    "description": "Découvrez notre carte de spécialités japonaises : sushis, makis, sashimis, poke bowls et bien plus",
    "provider": {
      "@type": "Restaurant",
      "name": "Sushieats",
      "servesCuisine": "Japonaise",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Châteaurenard",
        "addressCountry": "FR"
      }
    }
  };

  return (
    <>
      <SEOHead 
        title="Carte Restaurant Japonais - Sushis, Makis & Poke Bowls | Sushieats"
        description="Découvrez notre carte de spécialités japonaises fraîches : sushis, makis, sashimis, poke bowls, plateaux et desserts. Commandez en ligne ou réservez votre table."
        keywords="carte sushi, restaurant japonais, makis, sashimis, poke bowl, plateaux sushi, livraison sushi, commande en ligne"
        canonical={`${window.location.origin}/carte`}
        ogImage={menuHeroImage}
        ogType="website"
        structuredData={structuredData}
      />
      
      <div className="container mx-auto py-24 px-4">
        {/* Hero image section */}
        <div className="mb-12 relative rounded-xl overflow-hidden">
          <img 
            src={menuHeroImage} 
            alt="Carte de spécialités japonaises - sushis, makis et poke bowls"
            className="w-full h-64 md:h-96 lg:h-[500px] object-contain bg-white"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-shadow-lg">Notre Carte</h1>
              <p className="text-lg md:text-2xl lg:text-3xl max-w-4xl text-shadow">
                Découvrez nos spécialités japonaises préparées avec soin
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
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
    </>
  );
};

const Carte = () => {
  return <CarteContent />;
};

export default Carte;