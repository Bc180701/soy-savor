import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionHealth {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  totalChecks: number;
}

export function useSessionStability() {
  const healthRef = useRef<SessionHealth>({
    isHealthy: true,
    lastCheck: Date.now(),
    consecutiveFailures: 0,
    totalChecks: 0
  });

  const checkSessionHealth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      healthRef.current.totalChecks++;
      healthRef.current.lastCheck = Date.now();

      if (error || !session) {
        healthRef.current.consecutiveFailures++;
        
        if (healthRef.current.consecutiveFailures >= 3) {
          healthRef.current.isHealthy = false;
          console.warn('🚨 Session instable détectée:', {
            consecutiveFailures: healthRef.current.consecutiveFailures,
            error: error?.message
          });
        }
        
        return false;
      }

      // Reset des échecs si la session est OK
      if (healthRef.current.consecutiveFailures > 0) {
        console.log('✅ Session rétablie après', healthRef.current.consecutiveFailures, 'échecs');
        healthRef.current.consecutiveFailures = 0;
        healthRef.current.isHealthy = true;
      }

      return true;
    } catch (error: any) {
      healthRef.current.consecutiveFailures++;
      console.error('💥 Erreur vérification session:', error.message);
      return false;
    }
  }, []);

  const forceSessionRefresh = useCallback(async () => {
    try {
      console.log('🔄 Rafraîchissement forcé de la session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Échec rafraîchissement session:', error.message);
        return false;
      }

      console.log('✅ Session rafraîchie avec succès');
      healthRef.current.consecutiveFailures = 0;
      healthRef.current.isHealthy = true;
      return true;
    } catch (error: any) {
      console.error('💥 Exception rafraîchissement session:', error.message);
      return false;
    }
  }, []);

  const getSessionStats = useCallback(() => {
    const health = healthRef.current;
    const uptime = health.totalChecks > 0 ? 
      ((health.totalChecks - health.consecutiveFailures) / health.totalChecks) * 100 : 100;

    return {
      isHealthy: health.isHealthy,
      uptime: Math.round(uptime * 100) / 100,
      consecutiveFailures: health.consecutiveFailures,
      totalChecks: health.totalChecks,
      lastCheck: new Date(health.lastCheck).toLocaleTimeString()
    };
  }, []);

  // Vérification périodique de la session
  useEffect(() => {
    const interval = setInterval(checkSessionHealth, 30000); // Toutes les 30s
    
    // Vérification initiale
    checkSessionHealth();

    return () => clearInterval(interval);
  }, [checkSessionHealth]);

  // Listener pour les changements de session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change:', event, session ? 'avec session' : 'sans session');
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        healthRef.current.consecutiveFailures = 0;
        healthRef.current.isHealthy = true;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    checkSessionHealth,
    forceSessionRefresh,
    getSessionStats,
    isHealthy: healthRef.current.isHealthy
  };
}