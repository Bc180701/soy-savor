
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { Restaurant } from "@/types/restaurant";

interface RestaurantSelectorProps {
  onRestaurantChange?: (restaurant: Restaurant) => void;
  showLabel?: boolean;
}

const RestaurantSelector = ({ onRestaurantChange, showLabel = true }: RestaurantSelectorProps) => {
  const { restaurants, currentRestaurant, setCurrentRestaurant, isLoading } = useRestaurantContext();

  const handleRestaurantChange = (restaurantId: string) => {
    const selectedRestaurant = restaurants.find(r => r.id === restaurantId);
    if (selectedRestaurant) {
      setCurrentRestaurant(selectedRestaurant);
      onRestaurantChange?.(selectedRestaurant);
    }
  };

  if (isLoading) {
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
          {restaurants.map((restaurant) => (
            <SelectItem key={restaurant.id} value={restaurant.id}>
              <div className="flex flex-col">
                <span className="font-medium">{restaurant.name}</span>
                {restaurant.city && (
                  <span className="text-sm text-gray-500">{restaurant.city}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RestaurantSelector;
