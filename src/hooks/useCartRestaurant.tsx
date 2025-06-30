
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { getRestaurantById } from "@/services/restaurantService";
import { Restaurant } from "@/types/restaurant";

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

      // Prendre le restaurant_id du premier article du panier
      const firstItem = items[0];
      if (!firstItem.menuItem.restaurant_id) {
        console.warn("Article sans restaurant_id:", firstItem);
        return;
      }

      // Vérifier que tous les articles du panier sont du même restaurant
      const allSameRestaurant = items.every(item => item.menuItem.restaurant_id === firstItem.menuItem.restaurant_id);
      if (!allSameRestaurant) {
        console.warn("Articles de restaurants différents dans le panier");
      }

      setIsLoading(true);
      try {
        console.log("🔍 Détection restaurant depuis panier:", firstItem.menuItem.restaurant_id);
        const restaurant = await getRestaurantById(firstItem.menuItem.restaurant_id);
        if (restaurant) {
          console.log("✅ Restaurant détecté:", restaurant.name);
          setCartRestaurant(restaurant);
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
