
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

export const useOrderingLockStatus = () => {
  const { currentRestaurant } = useRestaurantContext();
  const [isOrderingLocked, setIsOrderingLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkOrderingStatus = async () => {
    if (!currentRestaurant) {
      setIsOrderingLocked(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      console.log("🔒 Vérification statut commandes pour:", currentRestaurant.name);
      
      // Récupérer le statut directement depuis la base de données
      const { data, error } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', currentRestaurant.id)
        .single();

      if (error) {
        console.error("🔒 Erreur vérification statut:", error);
        setIsOrderingLocked(false);
        return;
      }

      const settings = ((data as any)?.settings as Record<string, any>) ?? {};
      const ordering_locked = typeof settings?.ordering_locked === 'boolean' ? settings.ordering_locked : false;
      const delivery_blocked = typeof settings?.delivery_blocked === 'boolean' ? settings.delivery_blocked : false;
      const pickup_blocked = typeof settings?.pickup_blocked === 'boolean' ? settings.pickup_blocked : false;
      
      // LOGIQUE CORRIGÉE : Si ordering_locked est true, tout est bloqué (priorité absolue)
      // Sinon, vérifier si les deux services spécifiques sont bloqués
      const locked = ordering_locked || (!ordering_locked && delivery_blocked && pickup_blocked);
      
      console.log("🔒 Statut récupéré - ordering_locked:", ordering_locked, "delivery_blocked:", delivery_blocked, "pickup_blocked:", pickup_blocked, "résultat final:", locked);
      console.log("🔒 [DEBUG] Settings complets reçus:", JSON.stringify(settings, null, 2));
      setIsOrderingLocked(locked);
      
    } catch (error) {
      console.error("🔒 Erreur lors de la vérification:", error);
      setIsOrderingLocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkOrderingStatus();
  }, [currentRestaurant]);

  // Polling fallback when WebSockets fail
  useEffect(() => {
    if (!currentRestaurant) return;

    let pollInterval: NodeJS.Timeout;

    const startPolling = () => {
      // Poll every 10 seconds as fallback
      pollInterval = setInterval(() => {
        checkOrderingStatus();
      }, 10000);
    };

    // Try WebSocket subscription first, fallback to polling if it fails
    const setupRealtime = () => {
      try {
        console.log("🔒 Configuration écoute temps réel pour:", currentRestaurant.id);
        
        const channel = supabase
          .channel('restaurant-settings-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'restaurants',
              filter: `id=eq.${currentRestaurant.id}`
            },
            (payload) => {
              console.log("🔒 Changement détecté en temps réel:", payload);
              
              const settings = (payload.new?.settings as Record<string, any>) ?? {};
              const ordering_locked = typeof settings?.ordering_locked === 'boolean' ? settings.ordering_locked : false;
              const delivery_blocked = typeof settings?.delivery_blocked === 'boolean' ? settings.delivery_blocked : false;
              const pickup_blocked = typeof settings?.pickup_blocked === 'boolean' ? settings.pickup_blocked : false;
              
              const locked = ordering_locked || (!ordering_locked && delivery_blocked && pickup_blocked);
              
              console.log("🔒 Nouveau statut - ordering_locked:", ordering_locked, "delivery_blocked:", delivery_blocked, "pickup_blocked:", pickup_blocked, "résultat final:", locked);
              setIsOrderingLocked(locked);
            }
          )
          .subscribe();

        return () => {
          console.log("🔒 Arrêt écoute temps réel");
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.warn("🔒 WebSocket failed, falling back to polling:", error);
        startPolling();
        return () => {
          if (pollInterval) {
            clearInterval(pollInterval);
          }
        };
      }
    };

    const cleanup = setupRealtime();

    return () => {
      cleanup();
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentRestaurant]);

  return { isOrderingLocked, isLoading, checkOrderingStatus };
};
