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
  order_alert_phone?: string;
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
        .select('id, name, city, delivery_phone, settings')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        city: r.city,
        delivery_phone: r.delivery_phone || undefined,
        order_alert_phone: r.settings?.order_alert_phone || ""
      }));
      setRestaurants(mapped);
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

  const updatePhones = async (restaurantId: string, deliveryPhone: string, alertPhone: string) => {
    setSaving(restaurantId);
    try {
      // Récupérer les paramètres actuels pour ne pas écraser d'autres clés
      const { data: currentData, error: fetchError } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', restaurantId)
        .single();

      if (fetchError) throw fetchError;

      const currentSettings = (currentData?.settings as Record<string, any>) ?? {};
      // Préserver TOUS les settings existants et seulement modifier order_alert_phone
      const updatedSettings = { 
        ...currentSettings, 
        order_alert_phone: alertPhone || null 
      };

      const { error } = await supabase
        .from('restaurants')
        .update({ 
          delivery_phone: deliveryPhone || null,
          settings: updatedSettings
        })
        .eq('id', restaurantId);

      if (error) throw error;

      // Mettre à jour l'état local
      setRestaurants(prev => 
        prev.map(restaurant => 
          restaurant.id === restaurantId 
            ? { 
                ...restaurant, 
                delivery_phone: deliveryPhone || undefined,
                order_alert_phone: alertPhone || ""
              }
            : restaurant
        )
      );

      toast({
        title: "Succès",
        description: "Numéros mis à jour",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les numéros",
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
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex-1">
                    <Label htmlFor={`alert-${restaurant.id}`} className="text-sm">
                      Numéro d'alerte nouvelle commande
                    </Label>
                    <Input
                      id={`alert-${restaurant.id}`}
                      type="tel"
                      placeholder="Ex: +33123456789"
                      value={restaurant.order_alert_phone || ""}
                      onChange={(e) => {
                        setRestaurants(prev => 
                          prev.map(r => 
                            r.id === restaurant.id 
                              ? { ...r, order_alert_phone: e.target.value }
                              : r
                          )
                        );
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Le livreur reçoit le SMS quand la commande part. Le numéro d'alerte reçoit un SMS dès qu'une commande est payée.
                  </p>
                  <Button
                    onClick={() => updatePhones(
                      restaurant.id,
                      restaurant.delivery_phone || "",
                      restaurant.order_alert_phone || ""
                    )}
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
              </div>
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