
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { getRestaurantById, RESTAURANTS } from "@/services/restaurantService";
import { Restaurant } from "@/types/restaurant";

// Fonction utilitaire pour détecter le restaurant depuis la catégorie
const detectRestaurantFromCategory = (category: string): string | null => {
  console.log("🔍 Détection restaurant depuis catégorie:", category);
  
  // Mapping des catégories vers les restaurants
  const categoryMapping: { [key: string]: string } = {
    // Catégories pour Châteaurenard
    'box_du_midi': RESTAURANTS.CHATEAURENARD,
    'sushis': RESTAURANTS.CHATEAURENARD,
    'makis': RESTAURANTS.CHATEAURENARD,
    'california': RESTAURANTS.CHATEAURENARD,
    'spring': RESTAURANTS.CHATEAURENARD,
    'sashimis': RESTAURANTS.CHATEAURENARD,
    'chirashis': RESTAURANTS.CHATEAURENARD,
    'plateaux': RESTAURANTS.CHATEAURENARD,
    'accompagnements': RESTAURANTS.CHATEAURENARD,
    'desserts': RESTAURANTS.CHATEAURENARD,
    'boissons': RESTAURANTS.CHATEAURENARD,
    'entrees': RESTAURANTS.CHATEAURENARD,
    'soupes': RESTAURANTS.CHATEAURENARD,
    // Catégories pour St Martin de Crau
    'stmartin_sushis': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_makis': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_california': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_plateaux': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_accompagnements': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_desserts': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_boissons': RESTAURANTS.ST_MARTIN_DE_CRAU,
  };

  // Recherche directe dans le mapping
  if (categoryMapping[category]) {
    console.log("✅ Restaurant trouvé via mapping:", categoryMapping[category]);
    return categoryMapping[category];
  }

  // Recherche par mots-clés
  if (category.includes('stmartin') || category.includes('st_martin')) {
    console.log("✅ Restaurant détecté: St Martin de Crau (par mot-clé)");
    return RESTAURANTS.ST_MARTIN_DE_CRAU;
  }
  
  if (category.includes('chateaurenard') || category.includes('chato')) {
    console.log("✅ Restaurant détecté: Châteaurenard (par mot-clé)");
    return RESTAURANTS.CHATEAURENARD;
  }

  // Par défaut, assigner à Châteaurenard pour les catégories standards
  const defaultCategories = [
    'sushis', 'makis', 'california', 'spring', 'sashimis', 'chirashis', 
    'plateaux', 'accompagnements', 'desserts', 'boissons', 'entrees', 
    'soupes', 'box_du_midi'
  ];
  
  if (defaultCategories.includes(category)) {
    console.log("✅ Restaurant par défaut: Châteaurenard");
    return RESTAURANTS.CHATEAURENARD;
  }
  
  console.warn("❌ Aucun restaurant détecté pour la catégorie:", category);
  return null;
};

export const useCartRestaurant = () => {
  const { items } = useCart();
  const [cartRestaurant, setCartRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const detectRestaurantFromCart = async () => {
      if (items.length === 0) {
        console.log("🛒 Panier vide, aucun restaurant à détecter");
        setCartRestaurant(null);
        return;
      }

      console.log("🔍 Détection restaurant pour", items.length, "articles");

      // Prendre le premier article du panier
      const firstItem = items[0];
      let restaurantId: string | null = null;

      // Essayer d'abord avec restaurant_id si disponible
      if (firstItem.menuItem.restaurant_id) {
        restaurantId = firstItem.menuItem.restaurant_id;
        console.log("🔍 Restaurant ID trouvé directement:", restaurantId);
      } else {
        // Sinon, détecter depuis la catégorie
        restaurantId = detectRestaurantFromCategory(firstItem.menuItem.category);
        console.log("🔍 Restaurant ID détecté depuis catégorie:", restaurantId);
      }

      if (!restaurantId) {
        console.warn("❌ Impossible de détecter le restaurant pour:", firstItem);
        // Utiliser Châteaurenard par défaut si aucun restaurant n'est détecté
        restaurantId = RESTAURANTS.CHATEAURENARD;
        console.log("🔧 Utilisation du restaurant par défaut:", restaurantId);
      }

      // Vérifier que tous les articles du panier sont du même restaurant
      const restaurantIds = items.map(item => {
        return item.menuItem.restaurant_id || detectRestaurantFromCategory(item.menuItem.category) || RESTAURANTS.CHATEAURENARD;
      });
      
      const uniqueRestaurants = [...new Set(restaurantIds)];
      
      if (uniqueRestaurants.length > 1) {
        console.warn("⚠️ Articles de restaurants différents dans le panier:", uniqueRestaurants);
        // Utiliser le restaurant le plus fréquent
        const restaurantCounts = restaurantIds.reduce((acc, id) => {
          acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        restaurantId = Object.entries(restaurantCounts)
          .sort(([,a], [,b]) => b - a)[0][0];
        
        console.log("🔧 Restaurant sélectionné (le plus fréquent):", restaurantId);
      }

      setIsLoading(true);
      try {
        console.log("🔍 Chargement restaurant:", restaurantId);
        const restaurant = await getRestaurantById(restaurantId);
        if (restaurant) {
          console.log("✅ Restaurant détecté:", restaurant.name);
          setCartRestaurant(restaurant);
        } else {
          console.warn("❌ Restaurant non trouvé pour ID:", restaurantId);
          // Charger le restaurant par défaut
          const defaultRestaurant = await getRestaurantById(RESTAURANTS.CHATEAURENARD);
          if (defaultRestaurant) {
            console.log("🔧 Restaurant par défaut chargé:", defaultRestaurant.name);
            setCartRestaurant(defaultRestaurant);
          }
        }
      } catch (error) {
        console.error("❌ Erreur détection restaurant:", error);
      } finally {
        setIsLoading(false);
      }
    };

    detectRestaurantFromCart();
  }, [items]);

  return { cartRestaurant, isLoading };
};
