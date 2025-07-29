import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOrderNotifications = (isAdmin: boolean, restaurantId?: string) => {
  const { toast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const originalTitleRef = useRef(document.title);
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create notification sound using Web Audio API
  const playNotificationSound = (forcePlay = false) => {
    console.log('🔊 Tentative de lecture du son...', { 
      audioContextExists: !!audioContextRef.current,
      audioEnabled,
      forcePlay,
      audioState: audioContextRef.current?.state 
    });
    
    if (!audioContextRef.current || (!audioEnabled && !forcePlay)) {
      console.log('❌ Son non joué:', { audioContext: !!audioContextRef.current, audioEnabled, forcePlay });
      return;
    }
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Configuration du son (bip court et aigu)
      oscillator.frequency.value = 800; // 800 Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.3);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
      
      console.log('✅ Son joué avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la lecture du son:', error);
    }
  };

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

  // Initialize audio context on first user interaction
  const enableAudio = async () => {
    console.log('🎵 Initialisation de l\'audio...');
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('🎵 AudioContext créé:', audioContextRef.current.state);
      }
      
      if (audioContextRef.current.state === 'suspended') {
        console.log('🎵 Reprise de l\'AudioContext...');
        await audioContextRef.current.resume();
      }
      
      console.log('🎵 État AudioContext après reprise:', audioContextRef.current.state);
      
      setAudioEnabled(true);
      console.log('🔊 Audio notifications activées');
      
      // Test sound avec un petit délai et forcePlay pour contourner le problème de timing du state
      setTimeout(() => {
        console.log('🎵 Test du son...');
        playNotificationSound(true);
      }, 100);
    } catch (error) {
      console.error('❌ Impossible d\'activer le son:', error);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    console.log('🔗 Configuration des notifications en temps réel pour restaurant:', restaurantId);

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
          console.log('🔔 Nouvelle commande reçue:', payload);
          console.log('🔔 Event details:', {
            event: payload.eventType,
            table: payload.table,
            new: payload.new,
            restaurant_id: payload.new?.restaurant_id,
            filter_restaurant: restaurantId
          });
          
          // Play notification sound
          playNotificationSound();

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
      .subscribe((status) => {
        console.log('📡 Statut subscription:', status);
      });

    return () => {
      console.log('🔌 Déconnexion du canal de notifications');
      supabase.removeChannel(channel);
      stopTitleBlink();
    };
  }, [isAdmin, restaurantId, audioEnabled, toast]);

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
    audioEnabled,
    enableAudio,
    clearNotifications: stopTitleBlink
  };
};