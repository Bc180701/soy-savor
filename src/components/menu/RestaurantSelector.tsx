
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { Restaurant } from "@/types/restaurant";
import { isRestaurantOpenNow, isRestaurantOpenToday } from "@/services/openingHoursService";

interface RestaurantSelectorProps {
  onRestaurantChange?: (restaurant: Restaurant) => void;
  showLabel?: boolean;
}

const RestaurantSelector = ({ onRestaurantChange, showLabel = true }: RestaurantSelectorProps) => {
  const { restaurants, currentRestaurant, setCurrentRestaurant, isLoading } = useRestaurantContext();
  const [restaurantStatus, setRestaurantStatus] = useState<{[key: string]: boolean}>({});
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const checkRestaurantStatus = async () => {
      if (!restaurants.length) return;
      
      setStatusLoading(true);
      const statusMap: {[key: string]: boolean} = {};
      
      for (const restaurant of restaurants) {
        const isOpen = await isRestaurantOpenToday(restaurant.id);
        statusMap[restaurant.id] = isOpen;
      }
      
      setRestaurantStatus(statusMap);
      setStatusLoading(false);
    };

    if (restaurants.length > 0) {
      checkRestaurantStatus();
    }
  }, [restaurants]);

  const handleRestaurantChange = (restaurantId: string) => {
    const selectedRestaurant = restaurants.find(r => r.id === restaurantId);
    const isOpen = restaurantStatus[restaurantId];
    
    if (selectedRestaurant && isOpen) {
      setCurrentRestaurant(selectedRestaurant);
      onRestaurantChange?.(selectedRestaurant);
    }
  };

  if (isLoading || statusLoading) {
    return <div className="h-10 bg-gray-100 animate-pulse rounded"></div>;
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="text-sm font-medium text-gray-700">
          Choisissez votre restaurant
        </label>
      )}
      <Select
        value={currentRestaurant?.id || ""}
        onValueChange={handleRestaurantChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionnez un restaurant" />
        </SelectTrigger>
        <SelectContent>
          {restaurants.map((restaurant) => {
            const isOpen = restaurantStatus[restaurant.id];
            const isDisabled = !isOpen;
            
            return (
              <SelectItem 
                key={restaurant.id} 
                value={restaurant.id}
                disabled={isDisabled}
                className={isDisabled ? 'opacity-60' : ''}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isDisabled ? 'text-gray-500' : ''}`}>
                      {restaurant.name}
                    </span>
                    {isDisabled && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        FERMÉ
                      </span>
                    )}
                  </div>
                  {restaurant.city && (
                    <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                      {restaurant.city}
                    </span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RestaurantSelector;
