import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Restaurant } from "@/types/restaurant";

export const useRestaurantOrderingStatus = (restaurants: Restaurant[]) => {
  const [orderingStatus, setOrderingStatus] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOrderingStatus = async () => {
      if (restaurants.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const statusMap: {[key: string]: boolean} = {};
        
        // Vérifier le statut de verrouillage pour chaque restaurant
        for (const restaurant of restaurants) {
          const settings = (restaurant.settings as Record<string, any>) ?? {};
          const isLocked = typeof settings?.ordering_locked === 'boolean' ? settings.ordering_locked : false;
          statusMap[restaurant.id] = !isLocked; // true = ouvert (non verrouillé)
        }
        
        console.log("🔒 Statut verrouillage restaurants:", statusMap);
        setOrderingStatus(statusMap);
        
      } catch (error) {
        console.error("🔒 Erreur lors de la vérification du statut:", error);
        // En cas d'erreur, considérer tous les restaurants comme fermés
        const statusMap: {[key: string]: boolean} = {};
        restaurants.forEach(restaurant => {
          statusMap[restaurant.id] = false;
        });
        setOrderingStatus(statusMap);
      } finally {
        setLoading(false);
      }
    };

    checkOrderingStatus();
  }, [restaurants]);

  // Écouter les changements en temps réel
  useEffect(() => {
    if (restaurants.length === 0) return;

    const restaurantIds = restaurants.map(r => r.id);
    console.log("🔒 Configuration écoute temps réel pour restaurants:", restaurantIds);
    
    const channel = supabase
      .channel('restaurants-ordering-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants'
        },
        (payload) => {
          const updatedRestaurantId = payload.new?.id;
          if (restaurantIds.includes(updatedRestaurantId)) {
            console.log("🔒 Changement statut restaurant détecté:", updatedRestaurantId);
            const settings = (payload.new?.settings as Record<string, any>) ?? {};
            const isLocked = typeof settings?.ordering_locked === 'boolean' ? settings.ordering_locked : false;
            
            setOrderingStatus(prev => ({
              ...prev,
              [updatedRestaurantId]: !isLocked
            }));
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🔒 Arrêt écoute temps réel restaurants");
      supabase.removeChannel(channel);
    };
  }, [restaurants]);

  return { orderingStatus, loading };
};