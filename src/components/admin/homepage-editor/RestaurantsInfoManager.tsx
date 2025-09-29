import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface RestaurantInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  display_order: number;
  hours: RestaurantHour[];
}

interface RestaurantHour {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_open: boolean;
  slot_number: number;
  restaurant_info_id: string;
}

const DAYS = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

const RestaurantsInfoManager = () => {
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      
      // Récupérer les restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants_info')
        .select('*')
        .order('display_order');

      if (restaurantsError) throw restaurantsError;

      // Récupérer les horaires
      const { data: hoursData, error: hoursError } = await supabase
        .from('restaurants_info_hours')
        .select('*')
        .order('day_of_week, slot_number');

      if (hoursError) throw hoursError;

      // Associer les horaires aux restaurants
      const restaurantsWithHours = restaurantsData.map(restaurant => ({
        ...restaurant,
        hours: hoursData.filter(hour => hour.restaurant_info_id === restaurant.id)
      }));

      setRestaurants(restaurantsWithHours);
    } catch (error: any) {
      console.error("Erreur lors du chargement des restaurants:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les restaurants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRestaurant = async (restaurant: RestaurantInfo) => {
    try {
      setSaving(true);

      // Sauvegarder les infos du restaurant
      const { error: restaurantError } = await supabase
        .from('restaurants_info')
        .upsert({
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          city: restaurant.city,
          postal_code: restaurant.postal_code,
          phone: restaurant.phone,
          email: restaurant.email,
          is_active: restaurant.is_active,
          display_order: restaurant.display_order,
        });

      if (restaurantError) throw restaurantError;

      // Supprimer les anciennes heures
      const { error: deleteError } = await supabase
        .from('restaurants_info_hours')
        .delete()
        .eq('restaurant_info_id', restaurant.id);

      if (deleteError) throw deleteError;

      // Insérer les nouvelles heures
      if (restaurant.hours.length > 0) {
        const { error: hoursError } = await supabase
          .from('restaurants_info_hours')
          .insert(restaurant.hours.map(hour => ({
            ...hour,
            restaurant_info_id: restaurant.id,
          })));

        if (hoursError) throw hoursError;
      }

      toast({
        title: "Succès",
        description: "Restaurant mis à jour avec succès",
      });

      await fetchRestaurants();
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le restaurant",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addNewRestaurant = () => {
    const newRestaurant: RestaurantInfo = {
      id: crypto.randomUUID(),
      name: "",
      address: "",
      city: "",
      postal_code: "",
      phone: "",
      email: "",
      is_active: true,
      display_order: restaurants.length,
      hours: []
    };
    setRestaurants([...restaurants, newRestaurant]);
  };

  const updateRestaurant = (index: number, field: keyof RestaurantInfo, value: any) => {
    const updated = [...restaurants];
    updated[index] = { ...updated[index], [field]: value };
    setRestaurants(updated);
  };

  const addTimeSlot = (restaurantIndex: number, dayOfWeek: number) => {
    const updated = [...restaurants];
    const existingSlots = updated[restaurantIndex].hours.filter(h => h.day_of_week === dayOfWeek);
    const newSlotNumber = existingSlots.length > 0 ? Math.max(...existingSlots.map(s => s.slot_number)) + 1 : 1;
    
    const newHour: RestaurantHour = {
      id: crypto.randomUUID(),
      day_of_week: dayOfWeek,
      open_time: "11:00",
      close_time: "22:00",
      is_open: true,
      slot_number: newSlotNumber,
      restaurant_info_id: updated[restaurantIndex].id
    };
    
    updated[restaurantIndex].hours.push(newHour);
    setRestaurants(updated);
  };

  const updateTimeSlot = (restaurantIndex: number, hourId: string, field: keyof RestaurantHour, value: any) => {
    const updated = [...restaurants];
    const hourIndex = updated[restaurantIndex].hours.findIndex(h => h.id === hourId);
    if (hourIndex !== -1) {
      updated[restaurantIndex].hours[hourIndex] = {
        ...updated[restaurantIndex].hours[hourIndex],
        [field]: value
      };
      setRestaurants(updated);
    }
  };

  const removeTimeSlot = (restaurantIndex: number, hourId: string) => {
    const updated = [...restaurants];
    updated[restaurantIndex].hours = updated[restaurantIndex].hours.filter(h => h.id !== hourId);
    setRestaurants(updated);
  };

  const deleteRestaurant = async (restaurantId: string) => {
    try {
      setSaving(true);
      
      // Supprimer les horaires
      await supabase
        .from('restaurants_info_hours')
        .delete()
        .eq('restaurant_info_id', restaurantId);

      // Supprimer le restaurant
      const { error } = await supabase
        .from('restaurants_info')
        .delete()
        .eq('id', restaurantId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Restaurant supprimé avec succès",
      });

      await fetchRestaurants();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le restaurant",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestion des restaurants</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les restaurants affichés sur la page "Nos Restaurants" avec leurs horaires
          </p>
        </div>
        <Button onClick={addNewRestaurant} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un restaurant
        </Button>
      </div>

      {restaurants.map((restaurant, restaurantIndex) => (
        <Card key={restaurant.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {restaurant.name || "Nouveau restaurant"}
                </CardTitle>
                <CardDescription>
                  Informations et horaires du restaurant
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={restaurant.is_active}
                  onCheckedChange={(checked) => updateRestaurant(restaurantIndex, 'is_active', checked)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteRestaurant(restaurant.id)}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`name-${restaurant.id}`}>Nom du restaurant *</Label>
                <Input
                  id={`name-${restaurant.id}`}
                  value={restaurant.name}
                  onChange={(e) => updateRestaurant(restaurantIndex, 'name', e.target.value)}
                  placeholder="Nom du restaurant"
                />
              </div>
              <div>
                <Label htmlFor={`display_order-${restaurant.id}`}>Ordre d'affichage</Label>
                <Input
                  id={`display_order-${restaurant.id}`}
                  type="number"
                  value={restaurant.display_order}
                  onChange={(e) => updateRestaurant(restaurantIndex, 'display_order', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`address-${restaurant.id}`}>Adresse *</Label>
              <Input
                id={`address-${restaurant.id}`}
                value={restaurant.address}
                onChange={(e) => updateRestaurant(restaurantIndex, 'address', e.target.value)}
                placeholder="Adresse complète"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`city-${restaurant.id}`}>Ville *</Label>
                <Input
                  id={`city-${restaurant.id}`}
                  value={restaurant.city}
                  onChange={(e) => updateRestaurant(restaurantIndex, 'city', e.target.value)}
                  placeholder="Ville"
                />
              </div>
              <div>
                <Label htmlFor={`postal_code-${restaurant.id}`}>Code postal *</Label>
                <Input
                  id={`postal_code-${restaurant.id}`}
                  value={restaurant.postal_code}
                  onChange={(e) => updateRestaurant(restaurantIndex, 'postal_code', e.target.value)}
                  placeholder="Code postal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`phone-${restaurant.id}`}>Téléphone</Label>
                <Input
                  id={`phone-${restaurant.id}`}
                  value={restaurant.phone || ''}
                  onChange={(e) => updateRestaurant(restaurantIndex, 'phone', e.target.value)}
                  placeholder="Numéro de téléphone"
                />
              </div>
              <div>
                <Label htmlFor={`email-${restaurant.id}`}>Email</Label>
                <Input
                  id={`email-${restaurant.id}`}
                  value={restaurant.email || ''}
                  onChange={(e) => updateRestaurant(restaurantIndex, 'email', e.target.value)}
                  placeholder="Adresse email"
                />
              </div>
            </div>

            <Separator />

            {/* Horaires */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horaires d'ouverture
                </h4>
              </div>

              <div className="space-y-4">
                {DAYS.map(day => {
                  const dayHours = restaurant.hours.filter(h => h.day_of_week === day.value);
                  
                  return (
                    <div key={day.value} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="font-medium">{day.label}</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(restaurantIndex, day.value)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                      
                      {dayHours.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Fermé</p>
                      ) : (
                        <div className="space-y-2">
                          {dayHours.map(hour => (
                            <div key={hour.id} className="flex items-center gap-2">
                              <Switch
                                checked={hour.is_open}
                                onCheckedChange={(checked) => updateTimeSlot(restaurantIndex, hour.id, 'is_open', checked)}
                              />
                              <Input
                                type="time"
                                value={hour.open_time || ''}
                                onChange={(e) => updateTimeSlot(restaurantIndex, hour.id, 'open_time', e.target.value)}
                                disabled={!hour.is_open}
                                className="w-32"
                              />
                              <span>-</span>
                              <Input
                                type="time"
                                value={hour.close_time || ''}
                                onChange={(e) => updateTimeSlot(restaurantIndex, hour.id, 'close_time', e.target.value)}
                                disabled={!hour.is_open}
                                className="w-32"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeTimeSlot(restaurantIndex, hour.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => saveRestaurant(restaurant)}
                disabled={saving || !restaurant.name || !restaurant.address || !restaurant.city || !restaurant.postal_code}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RestaurantsInfoManager;