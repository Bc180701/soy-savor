
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { RestaurantContext, Restaurant } from "@/types/restaurant";
import { fetchRestaurants } from "@/services/restaurantService";

const RestaurantContextObj = createContext<RestaurantContext | undefined>(undefined);

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
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
        
        // Sélectionner le premier restaurant par défaut s'il n'y en a pas de sélectionné
        if (restaurantsList.length > 0 && !currentRestaurant) {
          const defaultRestaurant = restaurantsList[0];
          console.log("Sélection du restaurant par défaut:", defaultRestaurant.name);
          setCurrentRestaurant(defaultRestaurant);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des restaurants:", error);
        setRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  const value: RestaurantContext = {
    currentRestaurant,
    restaurants,
    setCurrentRestaurant,
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
