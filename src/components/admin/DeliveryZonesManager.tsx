
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

interface DeliveryLocation {
  id: number;
  city: string;
  postal_code: string;
  restaurant_id: string;
  is_active: boolean;
}

const DeliveryZonesManager = () => {
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [newLocation, setNewLocation] = useState({ city: "", postal_code: "" });
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();

  useEffect(() => {
    if (currentRestaurant?.id) {
      fetchDeliveryLocations();
    }
  }, [currentRestaurant?.id]);

  const fetchDeliveryLocations = async () => {
    if (!currentRestaurant?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_locations')
        .select('*')
        .eq('restaurant_id', currentRestaurant.id)
        .order('city', { ascending: true });

      if (error) throw error;
      if (data && Array.isArray(data)) {
        const validLocations = data.filter(location => location && !('error' in location));
        setDeliveryLocations(validLocations as any[]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des zones:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les zones de livraison",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDeliveryLocation = async () => {
    if (!currentRestaurant?.id || !newLocation.city.trim() || !newLocation.postal_code.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('delivery_locations')
        .insert({
          city: newLocation.city.trim(),
          postal_code: newLocation.postal_code.trim(),
          restaurant_id: currentRestaurant.id,
          is_active: true
        } as any);

      if (error) throw error;

      toast({
        title: "Zone ajoutée",
        description: `${newLocation.city} (${newLocation.postal_code}) ajouté avec succès`,
      });

      setNewLocation({ city: "", postal_code: "" });
      fetchDeliveryLocations();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la zone de livraison",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const deleteDeliveryLocation = async (id: number) => {
    try {
      const { error } = await supabase
        .from('delivery_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Zone supprimée",
        description: "La zone de livraison a été supprimée",
      });

      fetchDeliveryLocations();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la zone de livraison",
        variant: "destructive",
      });
    }
  };

  const copyZonesFromOtherRestaurant = async (sourceRestaurantId: string) => {
    if (!currentRestaurant?.id) return;

    try {
      // Récupérer les zones du restaurant source
      const { data: sourceZones, error: fetchError } = await supabase
        .from('delivery_locations')
        .select('city, postal_code')
        .eq('restaurant_id', sourceRestaurantId)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      if (!sourceZones || sourceZones.length === 0) {
        toast({
          title: "Aucune zone trouvée",
          description: "Le restaurant source n'a pas de zones de livraison",
          variant: "destructive",
        });
        return;
      }

      // Copier les zones vers le restaurant actuel
      const zonesToInsert = sourceZones.map(zone => ({
        city: (zone as any).city,
        postal_code: (zone as any).postal_code,
        restaurant_id: currentRestaurant.id,
        is_active: true
      }));

      const { error: insertError } = await supabase
        .from('delivery_locations')
        .insert(zonesToInsert as any);

      if (insertError) throw insertError;

      toast({
        title: "Zones copiées",
        description: `${sourceZones.length} zones ont été copiées avec succès`,
      });

      fetchDeliveryLocations();
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast({
        title: "Erreur",
        description: "Impossible de copier les zones de livraison",
        variant: "destructive",
      });
    }
  };

  if (!currentRestaurant) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Veuillez sélectionner un restaurant</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Zones de livraison - {currentRestaurant.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={newLocation.city}
                onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ex: Châteaurenard"
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                value={newLocation.postal_code}
                onChange={(e) => setNewLocation(prev => ({ ...prev, postal_code: e.target.value }))}
                placeholder="Ex: 13160"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addDeliveryLocation} disabled={adding} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {adding ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => copyZonesFromOtherRestaurant('11111111-1111-1111-1111-111111111111')}
              variant="outline"
              size="sm"
            >
              Copier zones Châteaurenard
            </Button>
            <Button 
              onClick={() => copyZonesFromOtherRestaurant('22222222-2222-2222-2222-222222222222')}
              variant="outline"
              size="sm"
            >
              Copier zones St-Martin-de-Crau
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zones configurées ({deliveryLocations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-primary animate-spin" />
            </div>
          ) : deliveryLocations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucune zone de livraison configurée
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ville</TableHead>
                  <TableHead>Code postal</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.city}</TableCell>
                    <TableCell>{location.postal_code}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        location.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {location.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => deleteDeliveryLocation(location.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryZonesManager;
