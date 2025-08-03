import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Restaurant {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  delivery_phone?: string;
  is_active: boolean;
}

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
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (restaurantsError) throw restaurantsError;

      setRestaurants(restaurantsData || []);
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
        address: restaurant.address || "",
        city: restaurant.city || "",
        postal_code: restaurant.postal_code || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        delivery_phone: restaurant.delivery_phone || "",
        is_active: restaurant.is_active,
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
      });
    }
    setIsDialogOpen(true);
  };

  const saveRestaurant = async () => {
    try {
      if (editingRestaurant) {
        // Mise à jour
        const { error } = await supabase
          .from('restaurants')
          .update({
            name: formData.name,
            address: formData.address || null,
            city: formData.city || null,
            postal_code: formData.postal_code || null,
            phone: formData.phone || null,
            email: formData.email || null,
            delivery_phone: formData.delivery_phone || null,
            is_active: formData.is_active,
          })
          .eq('id', editingRestaurant.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Restaurant mis à jour avec succès"
        });
      } else {
        // Création
        const { error } = await supabase
          .from('restaurants')
          .insert({
            name: formData.name,
            address: formData.address || null,
            city: formData.city || null,
            postal_code: formData.postal_code || null,
            phone: formData.phone || null,
            email: formData.email || null,
            delivery_phone: formData.delivery_phone || null,
            is_active: formData.is_active,
          });

        if (error) throw error;

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
        .from('restaurants')
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

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Gestion des Restaurants</h3>
          <p className="text-sm text-muted-foreground">
            Configurez les informations des restaurants et les numéros de livraison
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRestaurant ? "Modifier le restaurant" : "Ajouter un restaurant"}
              </DialogTitle>
              <DialogDescription>
                Renseignez les informations du restaurant et le numéro de téléphone du livreur.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du restaurant *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
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
              
              <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="phone">Téléphone du restaurant</Label>
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
              
              <div className="bg-blue-50 p-4 rounded-lg border">
                <Label htmlFor="delivery_phone" className="text-blue-800 font-medium">
                  Téléphone du livreur
                </Label>
                <Input
                  id="delivery_phone"
                  type="tel"
                  placeholder="Ex: +33123456789"
                  value={formData.delivery_phone}
                  onChange={(e) => setFormData({...formData, delivery_phone: e.target.value})}
                  className="mt-2"
                />
                <p className="text-sm text-blue-600 mt-2">
                  Ce numéro recevra automatiquement un SMS lorsqu'une commande passe en livraison
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
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveRestaurant} disabled={!formData.name.trim()}>
                {editingRestaurant ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                  <Badge variant={restaurant.is_active ? "default" : "secondary"} className="mt-1">
                    {restaurant.is_active ? "Actif" : "Inactif"}
                  </Badge>
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
              <div className="space-y-2">
                {restaurant.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div className="text-sm">
                      <div>{restaurant.address}</div>
                      <div>{restaurant.postal_code} {restaurant.city}</div>
                    </div>
                  </div>
                )}
                
                {restaurant.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{restaurant.phone}</span>
                  </div>
                )}
                
                {restaurant.delivery_phone && (
                  <div className="flex items-center space-x-2 bg-green-50 p-2 rounded">
                    <Phone className="h-4 w-4 text-green-600" />
                    <div className="text-sm">
                      <span className="font-medium text-green-800">Livreur: </span>
                      <span className="text-green-700">{restaurant.delivery_phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {restaurants.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            Aucun restaurant configuré
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantsManager;