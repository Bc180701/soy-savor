import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Save } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  city?: string;
  delivery_phone?: string;
}

const DeliveryPhoneManager = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, city, delivery_phone')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
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

  const updateDeliveryPhone = async (restaurantId: string, phoneNumber: string) => {
    setSaving(restaurantId);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ delivery_phone: phoneNumber || null })
        .eq('id', restaurantId);

      if (error) throw error;

      // Mettre à jour l'état local
      setRestaurants(prev => 
        prev.map(restaurant => 
          restaurant.id === restaurantId 
            ? { ...restaurant, delivery_phone: phoneNumber || undefined }
            : restaurant
        )
      );

      toast({
        title: "Succès",
        description: "Numéro de téléphone du livreur mis à jour",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le numéro",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Numéros de téléphone des livreurs</h3>
        <p className="text-sm text-muted-foreground">
          Configurez le numéro de téléphone qui recevra les alertes SMS lorsqu'une commande passe en livraison
        </p>
      </div>

      <div className="space-y-4">
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>{restaurant.name}</span>
                {restaurant.city && (
                  <span className="text-sm text-muted-foreground">({restaurant.city})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <Label htmlFor={`phone-${restaurant.id}`} className="text-sm">
                    Numéro du livreur
                  </Label>
                  <Input
                    id={`phone-${restaurant.id}`}
                    type="tel"
                    placeholder="Ex: +33123456789"
                    value={restaurant.delivery_phone || ""}
                    onChange={(e) => {
                      setRestaurants(prev => 
                        prev.map(r => 
                          r.id === restaurant.id 
                            ? { ...r, delivery_phone: e.target.value }
                            : r
                        )
                      );
                    }}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={() => updateDeliveryPhone(restaurant.id, restaurant.delivery_phone || "")}
                  disabled={saving === restaurant.id}
                  size="sm"
                >
                  {saving === restaurant.id ? (
                    "Sauvegarde..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ce numéro recevra automatiquement un SMS lorsqu'une commande passe en "En livraison"
              </p>
            </CardContent>
          </Card>
        ))}
        
        {restaurants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun restaurant actif trouvé
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPhoneManager;