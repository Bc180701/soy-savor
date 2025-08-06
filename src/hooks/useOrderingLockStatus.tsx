
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

      const settings = (data?.settings as Record<string, any>) ?? {};
      const locked = typeof settings?.ordering_locked === 'boolean' ? settings.ordering_locked : false;
      
      console.log("🔒 Statut récupéré:", locked);
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

  // Écouter les changements en temps réel
  useEffect(() => {
    if (!currentRestaurant) return;

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
          const locked = typeof settings?.ordering_locked === 'boolean' ? settings.ordering_locked : false;
          console.log("🔒 Nouveau statut:", locked);
          setIsOrderingLocked(locked);
        }
      )
      .subscribe();

    return () => {
      console.log("🔒 Arrêt écoute temps réel");
      supabase.removeChannel(channel);
    };
  }, [currentRestaurant]);

  return { isOrderingLocked, isLoading, checkOrderingStatus };
};
