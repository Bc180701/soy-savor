
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone?: string;
  email?: string;
  delivery_phone?: string;
  is_active: boolean;
  display_order: number;
  hours: RestaurantHour[];
}

interface RestaurantHour {
  id?: string;
  day_of_week: number;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  slot_number?: number;
}

interface FormHour {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
  slot_number: number;
}

interface DayHours {
  day_of_week: number;
  slots: FormHour[];
}

const dayNames = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
];

const RestaurantsManager = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    phone: "",
    email: "",
    delivery_phone: "",
    is_active: true,
    display_order: 0,
    dayHours: dayNames.map((_, index) => ({
      day_of_week: index,
      slots: [{
        day_of_week: index,
        is_open: index !== 0 && index !== 1, // Fermé dimanche et lundi par défaut
        open_time: index !== 0 && index !== 1 ? "11:00" : "",
        close_time: index !== 0 && index !== 1 ? "22:00" : "",
        slot_number: 1
      }]
    })) as DayHours[]
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants_info')
        .select('*')
        .order('display_order');

      if (restaurantsError) throw restaurantsError;

      const { data: hoursData, error: hoursError } = await supabase
        .from('restaurants_info_hours')
        .select('*')
        .order('day_of_week, slot_number');

      if (hoursError) throw hoursError;

      const restaurantsWithHours = restaurantsData.map(restaurant => ({
        ...restaurant,
        hours: hoursData.filter(hour => hour.restaurant_info_id === restaurant.id)
      }));

      setRestaurants(restaurantsWithHours);
    } catch (error) {
      console.error("Erreur lors du chargement des restaurants:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les restaurants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (restaurant?: Restaurant) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setFormData({
        name: restaurant.name,
        address: restaurant.address,
        city: restaurant.city,
        postal_code: restaurant.postal_code,
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        delivery_phone: restaurant.delivery_phone || "",
        is_active: restaurant.is_active,
        display_order: restaurant.display_order,
        dayHours: dayNames.map((_, dayIndex) => {
          const dayHours = restaurant.hours.filter(hour => hour.day_of_week === dayIndex);
          return {
            day_of_week: dayIndex,
            slots: dayHours.length > 0 
              ? dayHours.map(hour => ({
                  day_of_week: hour.day_of_week,
                  is_open: hour.is_open,
                  open_time: hour.open_time || "",
                  close_time: hour.close_time || "",
                  slot_number: hour.slot_number || 1
                }))
              : [{
                  day_of_week: dayIndex,
                  is_open: dayIndex !== 0 && dayIndex !== 1,
                  open_time: dayIndex !== 0 && dayIndex !== 1 ? "11:00" : "",
                  close_time: dayIndex !== 0 && dayIndex !== 1 ? "22:00" : "",
                  slot_number: 1
                }]
          };
        })
      });
    } else {
      setEditingRestaurant(null);
      setFormData({
        name: "",
        address: "",
        city: "",
        postal_code: "",
        phone: "",
        email: "",
        delivery_phone: "",
        is_active: true,
        display_order: Math.max(0, ...restaurants.map(r => r.display_order)) + 1,
        dayHours: dayNames.map((_, index) => ({
          day_of_week: index,
          slots: [{
            day_of_week: index,
            is_open: index !== 0 && index !== 1,
            open_time: index !== 0 && index !== 1 ? "11:00" : "",
            close_time: index !== 0 && index !== 1 ? "22:00" : "",
            slot_number: 1
          }]
        }))
      });
    }
    setIsDialogOpen(true);
  };

  const saveRestaurant = async () => {
    try {
      if (editingRestaurant) {
        // Mise à jour
        const { error } = await supabase
          .from('restaurants_info')
          .update({
            name: formData.name,
            address: formData.address,
            city: formData.city,
            postal_code: formData.postal_code,
            phone: formData.phone || null,
            email: formData.email || null,
            delivery_phone: formData.delivery_phone || null,
            is_active: formData.is_active,
            display_order: formData.display_order
          })
          .eq('id', editingRestaurant.id);

        if (error) throw error;

        // Supprimer les anciens horaires
        await supabase
          .from('restaurants_info_hours')
          .delete()
          .eq('restaurant_info_id', editingRestaurant.id);

        // Insérer les nouveaux horaires
        const hoursToInsert = formData.dayHours.flatMap(dayHour => 
          dayHour.slots.map(slot => ({
            restaurant_info_id: editingRestaurant.id,
            day_of_week: slot.day_of_week,
            is_open: slot.is_open,
            open_time: slot.is_open ? slot.open_time : null,
            close_time: slot.is_open ? slot.close_time : null,
            slot_number: slot.slot_number
          }))
        );

        const { error: hoursError } = await supabase
          .from('restaurants_info_hours')
          .insert(hoursToInsert);

        if (hoursError) throw hoursError;

        toast({
          title: "Succès",
          description: "Restaurant mis à jour avec succès"
        });
      } else {
        // Création
        const { data: newRestaurant, error } = await supabase
          .from('restaurants_info')
          .insert({
            name: formData.name,
            address: formData.address,
            city: formData.city,
            postal_code: formData.postal_code,
            phone: formData.phone || null,
            email: formData.email || null,
            delivery_phone: formData.delivery_phone || null,
            is_active: formData.is_active,
            display_order: formData.display_order
          })
          .select()
          .single();

        if (error) throw error;

        // Insérer les horaires
        const hoursToInsert = formData.dayHours.flatMap(dayHour => 
          dayHour.slots.map(slot => ({
            restaurant_info_id: newRestaurant.id,
            day_of_week: slot.day_of_week,
            is_open: slot.is_open,
            open_time: slot.is_open ? slot.open_time : null,
            close_time: slot.is_open ? slot.close_time : null,
            slot_number: slot.slot_number
          }))
        );

        const { error: hoursError } = await supabase
          .from('restaurants_info_hours')
          .insert(hoursToInsert);

        if (hoursError) throw hoursError;

        toast({
          title: "Succès",
          description: "Restaurant créé avec succès"
        });
      }

      setIsDialogOpen(false);
      fetchRestaurants();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le restaurant",
        variant: "destructive"
      });
    }
  };

  const deleteRestaurant = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce restaurant ?")) return;

    try {
      const { error } = await supabase
        .from('restaurants_info')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Restaurant supprimé avec succès"
      });
      fetchRestaurants();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le restaurant",
        variant: "destructive"
      });
    }
  };

  const updateSlot = (dayIndex: number, slotIndex: number, field: keyof FormHour, value: any) => {
    const newDayHours = [...formData.dayHours];
    newDayHours[dayIndex].slots[slotIndex] = { 
      ...newDayHours[dayIndex].slots[slotIndex], 
      [field]: value 
    };
    setFormData({ ...formData, dayHours: newDayHours });
  };

  const addSlot = (dayIndex: number) => {
    const newDayHours = [...formData.dayHours];
    const newSlotNumber = newDayHours[dayIndex].slots.length + 1;
    newDayHours[dayIndex].slots.push({
      day_of_week: dayIndex,
      is_open: true,
      open_time: "11:00",
      close_time: "22:00",
      slot_number: newSlotNumber
    });
    setFormData({ ...formData, dayHours: newDayHours });
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const newDayHours = [...formData.dayHours];
    if (newDayHours[dayIndex].slots.length > 1) {
      newDayHours[dayIndex].slots.splice(slotIndex, 1);
      // Renuméroter les créneaux
      newDayHours[dayIndex].slots.forEach((slot, index) => {
        slot.slot_number = index + 1;
      });
      setFormData({ ...formData, dayHours: newDayHours });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Restaurants</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRestaurant ? "Modifier le restaurant" : "Ajouter un restaurant"}
              </DialogTitle>
              <DialogDescription>
                Renseignez les informations du restaurant et ses horaires d'ouverture.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations générales</h3>
                
                <div>
                  <Label htmlFor="name">Nom du restaurant</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="delivery_phone">Téléphone du livreur</Label>
                  <Input
                    id="delivery_phone"
                    type="tel"
                    placeholder="Ex: +33123456789"
                    value={formData.delivery_phone}
                    onChange={(e) => setFormData({...formData, delivery_phone: e.target.value})}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Numéro utilisé pour envoyer des alertes SMS lors des livraisons
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="is_active">Restaurant actif</Label>
                </div>
                
                <div>
                  <Label htmlFor="display_order">Ordre d'affichage</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {/* Horaires */}
              <div className="space-y-4">
                <h3 className="font-medium">Horaires d'ouverture</h3>
                
                {formData.dayHours.map((dayHour, dayIndex) => (
                  <div key={dayIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dayNames[dayIndex]}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSlot(dayIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un créneau
                      </Button>
                    </div>
                    
                    {dayHour.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="border-l-2 border-gray-200 pl-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Créneau {slot.slot_number}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={slot.is_open}
                              onCheckedChange={(checked) => updateSlot(dayIndex, slotIndex, 'is_open', checked)}
                            />
                            {dayHour.slots.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSlot(dayIndex, slotIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {slot.is_open && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Ouverture</Label>
                              <Input
                                type="time"
                                value={slot.open_time}
                                onChange={(e) => updateSlot(dayIndex, slotIndex, 'open_time', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Fermeture</Label>
                              <Input
                                type="time"
                                value={slot.close_time}
                                onChange={(e) => updateSlot(dayIndex, slotIndex, 'close_time', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveRestaurant}>
                {editingRestaurant ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                      {restaurant.is_active ? "Actif" : "Inactif"}
                    </Badge>
                    <span className="text-sm text-gray-500">#{restaurant.display_order}</span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(restaurant)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRestaurant(restaurant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div className="text-sm">
                    <div>{restaurant.address}</div>
                    <div>{restaurant.postal_code} {restaurant.city}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {restaurant.hours.filter(h => h.is_open).length} créneaux d'ouverture
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RestaurantsManager;
