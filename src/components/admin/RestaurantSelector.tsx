
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
      <div className="flex items-center space-x-2 min-w-[250px]">
        <Building2 className="h-5 w-5 text-gray-500" />
        <span className="text-sm text-gray-600">Chargement des restaurants...</span>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center space-x-2 min-w-[250px]">
        <Building2 className="h-5 w-5 text-red-500" />
        <span className="text-sm text-red-500">Aucun restaurant disponible</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 min-w-[250px]">
      <Building2 className="h-5 w-5 text-gray-600" />
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
        <SelectTrigger className="w-56 border-gray-300 bg-white">
          <SelectValue placeholder="Sélectionner un restaurant" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg">
          {restaurants.map((restaurant) => (
            <SelectItem 
              key={restaurant.id} 
              value={restaurant.id}
              className="cursor-pointer hover:bg-gray-50"
            >
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
