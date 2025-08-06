
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
  const { currentRestaurant, setCurrentRestaurant } = useRestaurantContext();
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchLockStatus = async () => {
    if (!currentRestaurant) {
      console.log("🔒 Pas de restaurant sélectionné");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log("🔒 Récupération du statut pour restaurant:", currentRestaurant.name, currentRestaurant.id);
      
      // Récupérer les paramètres directement depuis la base de données pour être sûr
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', currentRestaurant.id)
        .single();

      if (error) {
        console.error("🔒 Erreur récupération restaurant:", error);
        throw error;
      }

      const settings = (restaurantData?.settings as Record<string, any>) ?? {};
      const orderingLocked = typeof settings?.ordering_locked === 'boolean' ? settings.ordering_locked : false;
      
      console.log("🔒 Paramètres récupérés depuis DB:", settings);
      console.log("🔒 État du verrouillage:", orderingLocked);
      
      setIsLocked(orderingLocked);
    } catch (error) {
      console.error("🔒 Erreur lors de la récupération du statut:", error);
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
      
      console.log("🔒 Mise à jour du statut de verrouillage:", locked, "pour", currentRestaurant.name);
      
      // Récupérer d'abord les paramètres actuels
      const { data: currentData, error: fetchError } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', currentRestaurant.id)
        .single();

      if (fetchError) {
        console.error("🔒 Erreur récupération paramètres actuels:", fetchError);
        throw fetchError;
      }

      // Fusionner avec les nouveaux paramètres
      const currentSettings = (currentData?.settings as Record<string, any>) ?? {};
      const updatedSettings = { ...currentSettings, ordering_locked: locked };

      console.log("🔒 Anciens paramètres:", currentSettings);
      console.log("🔒 Nouveaux paramètres:", updatedSettings);

      // Mettre à jour en base de données
      const { data: updatedData, error } = await supabase
        .from('restaurants')
        .update({ settings: updatedSettings })
        .eq('id', currentRestaurant.id)
        .select('*')
        .single();

      if (error) {
        console.error("🔒 Erreur mise à jour:", error);
        throw error;
      }

      console.log("🔒 Restaurant mis à jour:", updatedData);

      // Mettre à jour l'état local
      setIsLocked(locked);
      
      // Mettre à jour le contexte restaurant avec les nouvelles données
      const updatedRestaurant = {
        ...currentRestaurant,
        settings: updatedSettings
      };
      setCurrentRestaurant(updatedRestaurant);
      
      console.log("🔒 Statut de verrouillage mis à jour avec succès:", locked, "pour", currentRestaurant.name);
      
      toast({
        title: locked ? "Commandes verrouillées" : "Commandes déverrouillées",
        description: locked 
          ? "Les nouvelles commandes sont maintenant bloquées" 
          : "Les nouvelles commandes sont maintenant autorisées",
      });

      // Vérifier immédiatement après la mise à jour
      setTimeout(() => {
        fetchLockStatus();
      }, 500);

    } catch (error) {
      console.error("🔒 Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut des commandes",
        variant: "destructive",
      });
      
      // Remettre l'état précédent en cas d'erreur
      setIsLocked(!locked);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    console.log("🔒 useEffect déclenché, restaurant:", currentRestaurant?.name);
    fetchLockStatus();
  }, [currentRestaurant]);

  // Log de l'état actuel pour debug
  useEffect(() => {
    console.log("🔒 État actuel - isLocked:", isLocked, "loading:", loading, "saving:", saving);
  }, [isLocked, loading, saving]);

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
