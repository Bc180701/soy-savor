
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Restaurant } from "@/types/restaurant";
import { fetchRestaurants } from "@/services/restaurantService";
import { isRestaurantOpenNow } from "@/services/openingHoursService";
import { MapPin } from "lucide-react";

interface RestaurantSelectorProps {
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export const RestaurantSelector = ({ selectedRestaurant, onSelectRestaurant }: RestaurantSelectorProps) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantStatus, setRestaurantStatus] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await fetchRestaurants();
        setRestaurants(data);
        
        // Vérifier le statut de chaque restaurant
        const statusMap: {[key: string]: boolean} = {};
        for (const restaurant of data) {
          const isOpen = await isRestaurantOpenNow(restaurant.id);
          statusMap[restaurant.id] = isOpen;
        }
        setRestaurantStatus(statusMap);
        
      } catch (error) {
        console.error("Erreur lors du chargement des restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

  const handleRestaurantChange = (value: string) => {
    const restaurant = restaurants.find(r => r.id === value);
    const isOpen = restaurantStatus[value];
    
    if (restaurant && isOpen) {
      onSelectRestaurant(restaurant);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sélection du restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-t-transparent border-gold-500 rounded-full animate-spin" />
            <span className="ml-2">Chargement des restaurants...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Choisissez votre restaurant
        </CardTitle>
        <p className="text-sm text-gray-600">
          Sélectionnez le restaurant pour lequel vous voulez créer votre commande personnalisée
        </p>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedRestaurant?.id || ""}
          onValueChange={handleRestaurantChange}
        >
          {restaurants.map((restaurant) => {
            const isOpen = restaurantStatus[restaurant.id];
            const isDisabled = !isOpen;
            
            return (
              <div 
                key={restaurant.id} 
                className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                  isDisabled 
                    ? 'bg-gray-50 border-gray-200 opacity-60' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <RadioGroupItem 
                  value={restaurant.id} 
                  id={restaurant.id}
                  disabled={isDisabled}
                />
                <Label 
                  htmlFor={restaurant.id} 
                  className={`flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDisabled ? 'text-gray-500' : ''}`}>
                        {restaurant.name}
                      </p>
                      {restaurant.address && (
                        <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                          {restaurant.address}
                        </p>
                      )}
                    </div>
                    {isDisabled && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                        FERMÉ
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
