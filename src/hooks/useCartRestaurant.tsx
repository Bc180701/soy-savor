
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { getRestaurantById, RESTAURANTS } from "@/services/restaurantService";
import { Restaurant } from "@/types/restaurant";

// Fonction utilitaire pour détecter le restaurant depuis la catégorie
const detectRestaurantFromCategory = (category: string): string | null => {
  console.log("🔍 Détection restaurant depuis catégorie:", category);
  
  if (category.includes('stmartin') || category.includes('st_martin')) {
    return RESTAURANTS.ST_MARTIN_DE_CRAU;
  } else if (category.includes('chateaurenard') || category.includes('chato') || category === 'box_du_midi') {
    return RESTAURANTS.CHATEAURENARD;
  }
  
  return null;
};

export const useCartRestaurant = () => {
  const { items, selectedRestaurantId } = useCart();
  const [cartRestaurant, setCartRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const detectRestaurantFromCart = async (attempt = 1) => {
      console.log(`🔍 Détection restaurant (tentative ${attempt}) - Items:`, items.length, "Selected restaurant:", selectedRestaurantId);
      
      if (items.length === 0 && !selectedRestaurantId) {
        console.log("📭 Panier vide, reset du restaurant");
        setCartRestaurant(null);
        setRetryCount(0);
        return;
      }

      let restaurantId: string | null = null;

      // Priorité 1: utiliser selectedRestaurantId du panier
      if (selectedRestaurantId) {
        restaurantId = selectedRestaurantId;
        console.log("🔍 Restaurant ID du panier:", restaurantId);
      } 
      // Priorité 2: prendre le restaurant_id du premier article
      else if (items.length > 0) {
        const firstItem = items[0];
        if (firstItem.menuItem.restaurant_id) {
          restaurantId = firstItem.menuItem.restaurant_id;
          console.log("🔍 Restaurant ID depuis article:", restaurantId);
        } else {
          // Priorité 3: détecter depuis la catégorie
          restaurantId = detectRestaurantFromCategory(firstItem.menuItem.category);
          console.log("🔍 Restaurant ID détecté depuis catégorie:", restaurantId);
        }
      }

      if (!restaurantId) {
        console.warn("❌ Impossible de détecter le restaurant - attempt:", attempt);
        
        // Retry logic si on a des items mais pas de restaurant détecté
        if (items.length > 0 && attempt <= 3) {
          console.log("🔄 Nouvelle tentative dans 500ms...");
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            detectRestaurantFromCart(attempt + 1);
          }, 500);
          return;
        }
        
        setCartRestaurant(null);
        setRetryCount(0);
        return;
      }

      setIsLoading(true);
      try {
        console.log("🔍 Chargement restaurant:", restaurantId);
        const restaurant = await getRestaurantById(restaurantId);
        if (restaurant) {
          console.log("✅ Restaurant détecté:", restaurant.name);
          setCartRestaurant(restaurant);
          setRetryCount(0);
        } else {
          console.warn("❌ Restaurant non trouvé pour ID:", restaurantId);
          
          // Retry si le restaurant n'est pas trouvé
          if (attempt <= 2) {
            console.log("🔄 Retry chargement restaurant dans 1s...");
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              detectRestaurantFromCart(attempt + 1);
            }, 1000);
            return;
          }
          
          setCartRestaurant(null);
          setRetryCount(0);
        }
      } catch (error) {
        console.error("❌ Erreur détection restaurant:", error);
        
        // Retry sur erreur
        if (attempt <= 2) {
          console.log("🔄 Retry après erreur dans 1s...");
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            detectRestaurantFromCart(attempt + 1);
          }, 1000);
          return;
        }
        
        setCartRestaurant(null);
        setRetryCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    detectRestaurantFromCart();
  }, [items, selectedRestaurantId, retryCount]);

  // Fonction pour forcer un rechargement
  const refetchRestaurant = () => {
    console.log("🔄 Rechargement forcé du restaurant");
    setRetryCount(prev => prev + 1);
  };

  return { 
    cartRestaurant, 
    isLoading, 
    refetchRestaurant,
    hasItems: items.length > 0
  };
};
