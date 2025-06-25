
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Restaurant, type RestaurantContext } from "@/types/restaurant";
import { fetchRestaurants, RESTAURANTS } from "@/services/restaurantService";
import { useToast } from "@/hooks/use-toast";

const RestaurantContextValue = createContext<RestaurantContext | undefined>(undefined);

export const useRestaurantContext = () => {
  const context = useContext(RestaurantContextValue);
  if (!context) {
    throw new Error("useRestaurantContext must be used within a RestaurantProvider");
  }
  return context;
};

interface RestaurantProviderProps {
  children: ReactNode;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setIsLoading(true);
        const restaurantData = await fetchRestaurants();
        setRestaurants(restaurantData);
        
        // Définir le restaurant par défaut (Châteaurenard)
        const defaultRestaurant = restaurantData.find(r => r.id === RESTAURANTS.CHATEAURENARD);
        if (defaultRestaurant) {
          setCurrentRestaurant(defaultRestaurant);
        } else if (restaurantData.length > 0) {
          setCurrentRestaurant(restaurantData[0]);
        }
      } catch (error) {
        console.error("Error loading restaurants:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les restaurants",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, [toast]);

  const value: RestaurantContext = {
    currentRestaurant,
    restaurants,
    setCurrentRestaurant,
    isLoading
  };

  return (
    <RestaurantContextValue.Provider value={value}>
      {children}
    </RestaurantContextValue.Provider>
  );
};
