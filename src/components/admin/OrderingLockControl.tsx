
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Lock, Unlock } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { supabase } from "@/integrations/supabase/client";

const OrderingLockControl = () => {
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLockStatus = async () => {
    if (!currentRestaurant) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Récupérer les paramètres du restaurant
      const settings = currentRestaurant.settings || {};
      const orderingLocked = settings.ordering_locked || false;
      
      console.log("État du verrouillage des commandes:", orderingLocked);
      setIsLocked(orderingLocked);
    } catch (error) {
      console.error("Erreur lors de la récupération du statut:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer le statut des commandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLockStatus = async (locked: boolean) => {
    if (!currentRestaurant) {
      toast({
        title: "Erreur",
        description: "Aucun restaurant sélectionné",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      // Mettre à jour les paramètres du restaurant
      const updatedSettings = {
        ...currentRestaurant.settings,
        ordering_locked: locked
      };

      const { error } = await supabase
        .from('restaurants')
        .update({ settings: updatedSettings })
        .eq('id', currentRestaurant.id);

      if (error) throw error;

      setIsLocked(locked);
      toast({
        title: locked ? "Commandes verrouillées" : "Commandes déverrouillées",
        description: locked 
          ? "Les nouvelles commandes sont maintenant bloquées" 
          : "Les nouvelles commandes sont maintenant autorisées",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut des commandes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchLockStatus();
  }, [currentRestaurant]);

  if (!currentRestaurant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuration des commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Veuillez sélectionner un restaurant pour gérer ses paramètres de commande.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuration des commandes - {currentRestaurant.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isLocked ? <Lock className="h-4 w-4 text-red-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                  <Label htmlFor="ordering-lock" className="text-base font-medium">
                    Verrouillage des commandes
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  {isLocked 
                    ? "Les nouvelles commandes sont actuellement bloquées" 
                    : "Les nouvelles commandes sont autorisées"
                  }
                </p>
              </div>
              <Switch
                id="ordering-lock"
                checked={isLocked}
                onCheckedChange={updateLockStatus}
                disabled={saving}
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">À propos du verrouillage</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Empêche les nouveaux clients de passer commande</li>
                <li>• Utile en cas de surcharge ou de problème technique</li>
                <li>• N'affecte pas les commandes déjà en cours</li>
                <li>• Peut être activé/désactivé à tout moment</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderingLockControl;
