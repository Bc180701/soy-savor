
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Restaurant } from "@/types/restaurant";
import { fetchRestaurants } from "@/services/restaurantService";
import { MapPin } from "lucide-react";

interface RestaurantSelectorProps {
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
}

export const RestaurantSelector = ({ selectedRestaurant, onSelectRestaurant }: RestaurantSelectorProps) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await fetchRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error("Erreur lors du chargement des restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, []);

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
          onValueChange={(value) => {
            const restaurant = restaurants.find(r => r.id === value);
            if (restaurant) {
              onSelectRestaurant(restaurant);
            }
          }}
        >
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
              <RadioGroupItem value={restaurant.id} id={restaurant.id} />
              <Label htmlFor={restaurant.id} className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">{restaurant.name}</p>
                  {restaurant.address && (
                    <p className="text-sm text-gray-600">{restaurant.address}</p>
                  )}
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
