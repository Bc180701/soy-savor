
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone?: string;
  email?: string;
  display_order: number;
  hours: RestaurantHour[];
}

interface RestaurantHour {
  day_of_week: number;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
}

const dayNames = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
];

const NosRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Récupérer les restaurants
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from('restaurants_info')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (restaurantsError) throw restaurantsError;

        // Récupérer les horaires pour tous les restaurants
        const { data: hoursData, error: hoursError } = await supabase
          .from('restaurants_info_hours')
          .select('*')
          .order('day_of_week');

        if (hoursError) throw hoursError;

        // Associer les horaires aux restaurants
        const restaurantsWithHours = restaurantsData.map(restaurant => ({
          ...restaurant,
          hours: hoursData.filter(hour => hour.restaurant_info_id === restaurant.id)
        }));

        setRestaurants(restaurantsWithHours);
      } catch (error) {
        console.error("Erreur lors du chargement des restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Garde seulement HH:MM
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nos Restaurants
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez nos établissements et leurs horaires d'ouverture
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">{restaurant.name}</CardTitle>
                <CardDescription className="text-lg">
                  Retrouvez-nous dans ce restaurant pour déguster nos spécialités
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Adresse */}
                <div className="flex items-start space-x-3">
                  <MapPin className="text-gold-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">{restaurant.address}</p>
                    <p className="text-gray-600">{restaurant.postal_code} {restaurant.city}</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  {restaurant.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="text-gold-500 flex-shrink-0" size={20} />
                      <a 
                        href={`tel:${restaurant.phone.replace(/\s/g, '')}`}
                        className="text-gray-900 hover:text-gold-500 transition-colors"
                      >
                        {restaurant.phone}
                      </a>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="text-gold-500 flex-shrink-0" size={20} />
                      <a 
                        href={`mailto:${restaurant.email}`}
                        className="text-gray-900 hover:text-gold-500 transition-colors"
                      >
                        {restaurant.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Horaires */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="text-gold-500" size={20} />
                    <h3 className="font-medium text-gray-900">Horaires d'ouverture</h3>
                  </div>
                  <div className="space-y-2">
                    {restaurant.hours.map((hour) => (
                      <div key={hour.day_of_week} className="flex justify-between items-center">
                        <span className={`font-medium ${hour.day_of_week === 0 || hour.day_of_week === 1 ? 'text-red-500' : 'text-gray-900'}`}>
                          {dayNames[hour.day_of_week]}:
                        </span>
                        {hour.is_open && hour.open_time && hour.close_time ? (
                          <span className="text-gray-600">
                            {formatTime(hour.open_time)} - {formatTime(hour.close_time)}
                          </span>
                        ) : (
                          <Badge variant="secondary" className="text-red-500">
                            Fermé
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NosRestaurants;
