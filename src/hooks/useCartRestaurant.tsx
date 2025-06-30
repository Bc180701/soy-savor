
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { getRestaurantById } from "@/services/restaurantService";
import { Restaurant } from "@/types/restaurant";

// Fonction utilitaire pour détecter le restaurant depuis la catégorie
const detectRestaurantFromCategory = (category: string): string | null => {
  console.log("🔍 Détection restaurant depuis catégorie:", category);
  
  if (category.includes('stmartin') || category.includes('st_martin')) {
    // ID du restaurant St-Martin-de-Crau (à adapter selon vos données)
    return "your-st-martin-restaurant-id"; // Remplacez par l'ID réel
  } else if (category.includes('chateaurenard') || category.includes('chato')) {
    // ID du restaurant Châteaurenard (à adapter selon vos données)
    return "your-chateaurenard-restaurant-id"; // Remplacez par l'ID réel
  }
  
  return null;
};

export const useCartRestaurant = () => {
  const { items } = useCart();
  const [cartRestaurant, setCartRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const detectRestaurantFromCart = async () => {
      if (items.length === 0) {
        setCartRestaurant(null);
        return;
      }

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
        return;
      }

      // Vérifier que tous les articles du panier sont du même restaurant
      const allSameRestaurant = items.every(item => {
        const itemRestaurantId = item.menuItem.restaurant_id || detectRestaurantFromCategory(item.menuItem.category);
        return itemRestaurantId === restaurantId;
      });
      
      if (!allSameRestaurant) {
        console.warn("⚠️ Articles de restaurants différents dans le panier");
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
