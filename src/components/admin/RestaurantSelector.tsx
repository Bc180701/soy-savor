
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

const RestaurantSelector = () => {
  const { currentRestaurant, restaurants, setCurrentRestaurant, isLoading } = useRestaurantContext();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="h-4 w-4" />
      <Select
        value={currentRestaurant?.id || ""}
        onValueChange={(value) => {
          const restaurant = restaurants.find(r => r.id === value);
          if (restaurant) {
            setCurrentRestaurant(restaurant);
          }
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sélectionner un restaurant" />
        </SelectTrigger>
        <SelectContent>
          {restaurants.map((restaurant) => (
            <SelectItem key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RestaurantSelector;
