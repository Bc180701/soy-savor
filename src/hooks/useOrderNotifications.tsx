import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOrderNotifications = (isAdmin: boolean, restaurantId?: string) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const originalTitleRef = useRef(document.title);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    // Create audio element for notification sound
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification-sound.mp3');
      audioRef.current.volume = 0.5;
    }

    const channel = supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined
        },
        (payload) => {
          console.log('Nouvelle commande reçue:', payload);
          
          // Play notification sound
          if (audioRef.current) {
            audioRef.current.play().catch(console.error);
          }

          // Show toast notification
          toast({
            title: "🔔 Nouvelle commande!",
            description: `Commande #${payload.new.id.slice(0, 8)}... reçue`,
            duration: 5000,
          });

          // Start blinking tab title
          setHasNewOrders(true);
          startTitleBlink();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopTitleBlink();
    };
  }, [isAdmin, restaurantId, toast]);

  const startTitleBlink = () => {
    if (blinkIntervalRef.current) return;

    let isOriginalTitle = true;
    blinkIntervalRef.current = setInterval(() => {
      document.title = isOriginalTitle 
        ? '🔔 NOUVELLE COMMANDE!' 
        : originalTitleRef.current;
      isOriginalTitle = !isOriginalTitle;
    }, 1000);
  };

  const stopTitleBlink = () => {
    if (blinkIntervalRef.current) {
      clearInterval(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }
    document.title = originalTitleRef.current;
    setHasNewOrders(false);
  };

  // Stop blinking when user focuses on the tab
  useEffect(() => {
    const handleFocus = () => {
      if (hasNewOrders) {
        stopTitleBlink();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [hasNewOrders]);

  return {
    hasNewOrders,
    clearNotifications: stopTitleBlink
  };
};