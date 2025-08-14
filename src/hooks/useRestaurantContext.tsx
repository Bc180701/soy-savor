
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { RestaurantContext, Restaurant } from "@/types/restaurant";
import { fetchRestaurants } from "@/services/restaurantService";

const RestaurantContextObj = createContext<RestaurantContext | undefined>(undefined);

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        console.log("Chargement des restaurants...");
        setIsLoading(true);
        
        const restaurantsList = await fetchRestaurants();
        console.log("Restaurants chargés:", restaurantsList.length);
        
        setRestaurants(restaurantsList);
        
        // Récupérer le restaurant depuis les URL params
        const restaurantId = searchParams.get("restaurant");
        if (restaurantId && restaurantsList.length > 0) {
          const savedRestaurant = restaurantsList.find(r => r.id === restaurantId);
          if (savedRestaurant && (!currentRestaurant || currentRestaurant.id !== savedRestaurant.id)) {
            console.log("Restaurant restauré depuis URL:", savedRestaurant.name);
            setCurrentRestaurant(savedRestaurant);
          }
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement des restaurants:", error);
        setRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, [searchParams.get("restaurant")]);

  // Fonction pour changer de restaurant et persister dans l'URL
  const handleSetCurrentRestaurant = (restaurant: Restaurant | null) => {
    const currentRestaurantId = searchParams.get("restaurant");
    const newRestaurantId = restaurant?.id || null;
    
    // Ne mettre à jour que si le restaurant a vraiment changé
    if (currentRestaurantId !== newRestaurantId) {
      setCurrentRestaurant(restaurant);
      
      // Persister dans les URL params
      const newParams = new URLSearchParams(searchParams);
      if (restaurant) {
        newParams.set("restaurant", restaurant.id);
      } else {
        newParams.delete("restaurant");
      }
      setSearchParams(newParams);
    } else if (!currentRestaurant && restaurant) {
      // Mettre à jour l'état local si le restaurant n'est pas encore défini
      setCurrentRestaurant(restaurant);
    }
  };

  // Note: The ordering lock synchronization will be handled by individual components
  // to avoid circular dependency with the cart store

  const value: RestaurantContext = {
    currentRestaurant,
    restaurants,
    setCurrentRestaurant: handleSetCurrentRestaurant,
    isLoading,
  };

  return (
    <RestaurantContextObj.Provider value={value}>
      {children}
    </RestaurantContextObj.Provider>
  );
};

export const useRestaurantContext = () => {
  const context = useContext(RestaurantContextObj);
  if (context === undefined) {
    throw new Error("useRestaurantContext must be used within a RestaurantProvider");
  }
  return context;
};
