import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY } from "@/config/vapid";

export const usePushNotifications = (restaurantId: string | null) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier le support
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  // Vérifier le statut de permission au montage
  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, [restaurantId]);

  // Écouter les messages du SW (resubscribe)
  useEffect(() => {
    if (!isSupported) return;

    const onMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
        try {
          const newSubscription = event.data.subscription as PushSubscription;
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !restaurantId) return;

          const subscriptionData = newSubscription.toJSON();
          // Upsert pour remplacer l'ancienne subscription
          const { error: upsertError } = await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: user.id,
              restaurant_id: restaurantId,
              subscription_data: subscriptionData as any,
              user_agent: navigator.userAgent
            }, { onConflict: 'user_id,restaurant_id,subscription_endpoint' as any });

          if (upsertError) {
            console.error('Erreur upsert subscription (resubscribe):', upsertError);
          } else {
            setIsSubscribed(true);
          }
        } catch (e) {
          console.error('Erreur traitement PUSH_SUBSCRIPTION_CHANGED:', e);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage as any);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage as any);
  }, [isSupported, restaurantId]);

  // Vérifier si déjà abonné
  const checkSubscriptionStatus = async () => {
    if (!restaurantId) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Erreur vérification subscription:', err);
    }
  };

  // S'abonner aux notifications
  const subscribe = async () => {
    if (!restaurantId) {
      setError("Veuillez sélectionner un restaurant");
      return;
    }

    if (!isSupported) {
      setError("Les notifications ne sont pas supportées sur ce navigateur");
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      setError("Configuration VAPID manquante. Contactez l'administrateur.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Demander permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        throw new Error("Permission refusée");
      }

      // 2. Attendre que le Service Worker soit pret (deja enregistre dans main.tsx)
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker ready for subscription');

      // 3. Créer la subscription VAPID
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 4. Sauvegarder dans Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      const subscriptionData = subscription.toJSON();
      
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          subscription_data: subscriptionData as any,
          user_agent: navigator.userAgent
        });

      if (dbError) throw dbError;

      setIsSubscribed(true);
      console.log('[Push] Subscription successful');

    } catch (err: any) {
      console.error('Erreur abonnement:', err);
      setError(err.message || "Erreur lors de l'abonnement");
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Se désabonner
  const unsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Supprimer de Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && restaurantId) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurantId);
      }

      setIsSubscribed(false);
      console.log('[Push] Unsubscription successful');

    } catch (err: any) {
      console.error('Erreur désabonnement:', err);
      setError(err.message || "Erreur lors du désabonnement");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe
  };
};

// Utilitaire pour convertir VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
