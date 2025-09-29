
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

const RestaurantSelector = () => {
  const { currentRestaurant, restaurants, setCurrentRestaurant, isLoading } = useRestaurantContext();

  console.log("RestaurantSelector render - Current restaurant:", currentRestaurant?.name);
  console.log("RestaurantSelector render - Available restaurants:", restaurants.length);
  console.log("RestaurantSelector render - Loading:", isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 min-w-[200px]">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Chargement des restaurants...</span>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center space-x-2 min-w-[200px]">
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-red-500">Aucun restaurant disponible</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 min-w-[200px]">
      <Building2 className="h-4 w-4" />
      <Select
        value={currentRestaurant?.id || ""}
        onValueChange={(value) => {
          console.log("Changement de restaurant sélectionné:", value);
          const restaurant = restaurants.find(r => r.id === value);
          if (restaurant) {
            console.log("Restaurant trouvé:", restaurant.name);
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
