
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { RestaurantContext, Restaurant } from "@/types/restaurant";
import { fetchRestaurants } from "@/services/restaurantService";

const RESTAURANT_STORAGE_KEY = "selected_restaurant_id";

const RestaurantContextObj = createContext<RestaurantContext | undefined>(undefined);

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les restaurants seulement au montage initial
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        console.log("Chargement des restaurants...");
        setIsLoading(true);
        
        const restaurantsList = await fetchRestaurants();
        console.log("Restaurants chargés:", restaurantsList.length);
        
        setRestaurants(restaurantsList);
        
      } catch (error) {
        console.error("Erreur lors du chargement des restaurants:", error);
        setRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
  }, []); // Seulement au montage initial

  // Récupérer le restaurant depuis les URL params OU localStorage (séparé du fetch)
  useEffect(() => {
    if (restaurants.length === 0) return;
    
    // Priorité: URL params > localStorage
    const restaurantIdFromUrl = searchParams.get("restaurant");
    const restaurantIdFromStorage = localStorage.getItem(RESTAURANT_STORAGE_KEY);
    const restaurantId = restaurantIdFromUrl || restaurantIdFromStorage;
    
    if (restaurantId) {
      const savedRestaurant = restaurants.find(r => r.id === restaurantId);
      if (savedRestaurant && (!currentRestaurant || currentRestaurant.id !== savedRestaurant.id)) {
        console.log("Restaurant restauré:", savedRestaurant.name, "depuis", restaurantIdFromUrl ? "URL" : "localStorage");
        setCurrentRestaurant(savedRestaurant);
        
        // Synchroniser l'URL si le restaurant vient du localStorage
        if (!restaurantIdFromUrl && restaurantIdFromStorage) {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("restaurant", restaurantId);
          setSearchParams(newParams, { replace: true });
        }
      }
    }
  }, [restaurants]);

  // Fonction pour changer de restaurant et persister dans l'URL ET localStorage
  const handleSetCurrentRestaurant = (restaurant: Restaurant | null) => {
    const currentRestaurantId = searchParams.get("restaurant");
    const newRestaurantId = restaurant?.id || null;
    
    // Toujours mettre à jour localStorage
    if (restaurant) {
      localStorage.setItem(RESTAURANT_STORAGE_KEY, restaurant.id);
    } else {
      localStorage.removeItem(RESTAURANT_STORAGE_KEY);
    }
    
    // Ne mettre à jour l'URL que si le restaurant a vraiment changé
    if (currentRestaurantId !== newRestaurantId) {
      setCurrentRestaurant(restaurant);
      
      // Persister dans les URL params
      const newParams = new URLSearchParams(searchParams);
      if (restaurant) {
        newParams.set("restaurant", restaurant.id);
      } else {
        newParams.delete("restaurant");
      }
      setSearchParams(newParams, { replace: true });
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
