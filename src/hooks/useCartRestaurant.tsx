
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

  useEffect(() => {
    const detectRestaurantFromCart = async () => {
      console.log("🔍 Détection restaurant - Items:", items.length, "Selected restaurant:", selectedRestaurantId);
      
      if (items.length === 0 && !selectedRestaurantId) {
        setCartRestaurant(null);
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
        console.warn("❌ Impossible de détecter le restaurant");
        setCartRestaurant(null);
        return;
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
          setCartRestaurant(null);
        }
      } catch (error) {
        console.error("❌ Erreur détection restaurant:", error);
        setCartRestaurant(null);
      } finally {
        setIsLoading(false);
      }
    };

    detectRestaurantFromCart();
  }, [items, selectedRestaurantId]);

  return { cartRestaurant, isLoading };
};
