
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
  const [deliveryBlocked, setDeliveryBlocked] = useState(false);
  const [pickupBlocked, setPickupBlocked] = useState(false);
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
      const deliveryBlocked = typeof settings?.delivery_blocked === 'boolean' ? settings.delivery_blocked : false;
      const pickupBlocked = typeof settings?.pickup_blocked === 'boolean' ? settings.pickup_blocked : false;
      
      console.log("🔒 Paramètres récupérés depuis DB:", settings);
      console.log("🔒 État du verrouillage:", orderingLocked);
      
      setIsLocked(orderingLocked);
      setDeliveryBlocked(deliveryBlocked);
      setPickupBlocked(pickupBlocked);
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

  const updateOrderingSettings = async (settingType: 'general' | 'delivery' | 'pickup', value: boolean) => {
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
      
      console.log("🔒 Mise à jour des paramètres:", settingType, value, "pour", currentRestaurant.name);
      
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
      const settingKey = settingType === 'general' ? 'ordering_locked' : 
                        settingType === 'delivery' ? 'delivery_blocked' : 'pickup_blocked';
      const updatedSettings = { ...currentSettings, [settingKey]: value };

      console.log("🔒 Anciens paramètres:", currentSettings);
      console.log("🔒 Nouveaux paramètres:", updatedSettings);

      // Mettre à jour en base de données
      const { data: updatedData, error } = await supabase
        .from('restaurants')
        .update({ settings: updatedSettings })
        .eq('id', currentRestaurant.id)
        .select('*');

      if (error) {
        console.error("🔒 Erreur mise à jour:", error);
        throw error;
      }

      console.log("🔒 Restaurant mis à jour:", updatedData);

      // Mettre à jour l'état local
      if (settingType === 'general') {
        setIsLocked(value);
      } else if (settingType === 'delivery') {
        setDeliveryBlocked(value);
      } else if (settingType === 'pickup') {
        setPickupBlocked(value);
      }
      
      // Mettre à jour le contexte restaurant avec les nouvelles données
      const updatedRestaurant = {
        ...currentRestaurant,
        settings: updatedSettings
      };
      setCurrentRestaurant(updatedRestaurant);
      
      console.log("🔒 Paramètres mis à jour avec succès:", settingType, value, "pour", currentRestaurant.name);
      
      const messages = {
        general: value ? "Commandes verrouillées" : "Commandes déverrouillées",
        delivery: value ? "Livraisons bloquées" : "Livraisons autorisées", 
        pickup: value ? "À emporter bloqué" : "À emporter autorisé"
      };
      
      toast({
        title: messages[settingType],
        description: value 
          ? `Les nouvelles commandes ${settingType === 'general' ? '' : settingType === 'delivery' ? 'en livraison' : 'à emporter'} sont maintenant bloquées` 
          : `Les nouvelles commandes ${settingType === 'general' ? '' : settingType === 'delivery' ? 'en livraison' : 'à emporter'} sont maintenant autorisées`,
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
      if (settingType === 'general') {
        setIsLocked(!value);
      } else if (settingType === 'delivery') {
        setDeliveryBlocked(!value);
      } else if (settingType === 'pickup') {
        setPickupBlocked(!value);
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    console.log("🔒 useEffect déclenché, restaurant:", currentRestaurant?.name);
    fetchLockStatus();
  }, [currentRestaurant]);

  // Logique automatique : activer ordering_locked si delivery_blocked ET pickup_blocked
  useEffect(() => {
    if (loading || saving) return;
    
    if (deliveryBlocked && pickupBlocked && !isLocked) {
      console.log("🔒 Activation automatique du verrouillage général (livraison ET emporter bloqués)");
      updateOrderingSettings('general', true);
    }
  }, [deliveryBlocked, pickupBlocked, isLocked, loading, saving]);

  // Logique automatique : désactiver delivery_blocked et pickup_blocked si ordering_locked est activé
  useEffect(() => {
    if (loading || saving) return;
    
    if (isLocked && (deliveryBlocked || pickupBlocked)) {
      console.log("🔒 Désactivation automatique des blocages spécifiques (verrouillage général actif)");
      if (deliveryBlocked) {
        updateOrderingSettings('delivery', false);
      }
      if (pickupBlocked) {
        updateOrderingSettings('pickup', false);
      }
    }
  }, [isLocked, deliveryBlocked, pickupBlocked, loading, saving]);

  // Log de l'état actuel pour debug
  useEffect(() => {
    console.log("🔒 État actuel - isLocked:", isLocked, "deliveryBlocked:", deliveryBlocked, "pickupBlocked:", pickupBlocked, "loading:", loading, "saving:", saving);
  }, [isLocked, deliveryBlocked, pickupBlocked, loading, saving]);

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
            {/* Verrouillage général */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isLocked ? <Lock className="h-4 w-4 text-red-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                  <Label htmlFor="ordering-lock" className="text-base font-medium">
                    Verrouillage général des commandes
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  {isLocked 
                    ? "Toutes les nouvelles commandes sont bloquées" 
                    : "Toutes les commandes sont autorisées"
                  }
                </p>
              </div>
              <Switch
                id="ordering-lock"
                checked={isLocked}
                onCheckedChange={(value) => updateOrderingSettings('general', value)}
                disabled={saving}
              />
            </div>

            {/* Blocage des livraisons */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {deliveryBlocked ? <Lock className="h-4 w-4 text-red-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                  <Label htmlFor="delivery-lock" className="text-base font-medium">
                    Blocage des livraisons
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  {deliveryBlocked 
                    ? "Les commandes en livraison sont bloquées" 
                    : "Les commandes en livraison sont autorisées"
                  }
                </p>
              </div>
              <Switch
                id="delivery-lock"
                checked={deliveryBlocked}
                onCheckedChange={(value) => updateOrderingSettings('delivery', value)}
                disabled={saving || isLocked}
              />
            </div>

            {/* Blocage à emporter */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {pickupBlocked ? <Lock className="h-4 w-4 text-red-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                  <Label htmlFor="pickup-lock" className="text-base font-medium">
                    Blocage à emporter
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  {pickupBlocked 
                    ? "Les commandes à emporter sont bloquées" 
                    : "Les commandes à emporter sont autorisées"
                  }
                </p>
              </div>
              <Switch
                id="pickup-lock"
                checked={pickupBlocked}
                onCheckedChange={(value) => updateOrderingSettings('pickup', value)}
                disabled={saving || isLocked}
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">À propos des blocages</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Le verrouillage général désactive tous les types de commandes</li>
                <li>• Les blocages spécifiques permettent de désactiver uniquement les livraisons ou l'emporter</li>
                <li>• Si livraison ET emporter sont bloqués → le verrouillage général s'active automatiquement</li>
                <li>• Si le verrouillage général est activé → les blocages spécifiques se désactivent automatiquement</li>
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
