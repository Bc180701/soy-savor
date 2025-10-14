import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Restaurant {
  id: string;
  name: string;
  city: string;
}

interface RestaurantSessionSelectorProps {
  sessionRestaurant: string | null;
  onSelectRestaurant: (restaurantId: string) => void;
}

export const RestaurantSessionSelector = ({ 
  sessionRestaurant, 
  onSelectRestaurant 
}: RestaurantSessionSelectorProps) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string>(sessionRestaurant || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    // Ouvrir le dialog si aucun restaurant sélectionné
    if (!sessionRestaurant && restaurants.length > 0) {
      setIsDialogOpen(true);
    }
  }, [sessionRestaurant, restaurants]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, city')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
      
      // Si un seul restaurant, le sélectionner automatiquement
      if (data && data.length === 1 && !sessionRestaurant) {
        onSelectRestaurant(data[0].id);
        setSelectedId(data[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedId) {
      onSelectRestaurant(selectedId);
      setIsDialogOpen(false);
    }
  };

  const handleChangeRestaurant = () => {
    setIsDialogOpen(true);
  };

  const selectedRestaurant = restaurants.find(r => r.id === sessionRestaurant);

  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Badge affichant le restaurant actif */}
      {selectedRestaurant && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            {selectedRestaurant.name} - {selectedRestaurant.city}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleChangeRestaurant}
          >
            Changer
          </Button>
        </div>
      )}

      {/* Dialog de sélection */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sélectionner un restaurant</DialogTitle>
            <DialogDescription>
              Choisissez le restaurant pour lequel vous souhaitez recevoir les notifications de commandes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup value={selectedId} onValueChange={setSelectedId}>
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={restaurant.id} id={restaurant.id} />
                  <Label htmlFor={restaurant.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{restaurant.name}</div>
                    <div className="text-sm text-muted-foreground">{restaurant.city}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2">
            {sessionRestaurant && (
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
            )}
            <Button onClick={handleConfirm} disabled={!selectedId}>
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
