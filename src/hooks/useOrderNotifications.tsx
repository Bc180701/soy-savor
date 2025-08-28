import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOrderNotifications = (isAdmin: boolean, restaurantId?: string) => {
  const { toast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(() => {
    // Récupérer l'état depuis localStorage
    const saved = localStorage.getItem('admin-audio-enabled');
    return saved === 'true';
  });
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
  const enableAudio = async (playTestSound = true) => {
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
      // Sauvegarder l'état dans localStorage
      localStorage.setItem('admin-audio-enabled', 'true');
      console.log('🔊 Audio notifications activées');
      
      // Test sound seulement si demandé (activation manuelle)
      if (playTestSound) {
        setTimeout(() => {
          console.log('🎵 Test du son...');
          playNotificationSound(true);
        }, 100);
      }
    } catch (error) {
      console.error('❌ Impossible d\'activer le son:', error);
    }
  };

  // Réinitialiser l'AudioContext si l'audio était activé avant l'actualisation
  useEffect(() => {
    if (audioEnabled && !audioContextRef.current) {
      console.log('🔄 Réinitialisation de l\'AudioContext après actualisation...');
      enableAudio(false); // Ne pas jouer le son de test lors de la réinitialisation
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const restaurantFilterMsg = restaurantId ? `pour le restaurant ${restaurantId}` : 'pour TOUS les restaurants';
    console.log(`🔗 Configuration des notifications en temps réel ${restaurantFilterMsg}`);

    // SOLUTION TEMPORAIRE: Désactiver WebSocket pour éviter SecurityError
    // Utiliser polling HTTP à la place
    console.log('⚠️ WebSocket désactivé temporairement - utilisation du polling HTTP');
    
    let pollingInterval: NodeJS.Timeout;
    let lastCheckTime = new Date().getTime();
    
    pollingInterval = setInterval(async () => {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, created_at, restaurant_id')
          .gte('created_at', new Date(lastCheckTime).toISOString())
          .order('created_at', { ascending: false });
        
        if (!error && orders && orders.length > 0) {
          // Filtrer par restaurant si nécessaire
          const filteredOrders = restaurantId 
            ? orders.filter(order => order.restaurant_id === restaurantId)
            : orders;
          
          if (filteredOrders.length > 0) {
            // Traiter chaque nouvelle commande
            filteredOrders.forEach(order => {
              console.log('🔔 Nouvelle commande détectée via polling:', order);
              
              // Play notification sound
              playNotificationSound();

              // Show toast notification with restaurant info
              const restaurantName = order.restaurant_id === '11111111-1111-1111-1111-111111111111' ? 'Châteaurenard' : 'St Martin de Crau';
              toast({
                title: "🔔 Nouvelle commande!",
                description: `Commande #${order.id.slice(0, 8)}... reçue pour ${restaurantName}`,
                duration: 5000,
              });

              // Start blinking tab title
              setHasNewOrders(true);
              startTitleBlink();
            });
          }
        }
        
        lastCheckTime = new Date().getTime();
      } catch (error) {
        console.error('Erreur polling:', error);
      }
    }, 3000); // Vérifier toutes les 3 secondes

    return () => {
      console.log('🔌 Arrêt du polling de notifications');
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      stopTitleBlink();
    };
  }, [isAdmin, restaurantId, toast]);

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

  // Wrapper pour l'activation manuelle du son (avec test sonore)
  const handleEnableAudio = () => {
    enableAudio(true);
  };

  return {
    hasNewOrders,
    audioEnabled,
    enableAudio: handleEnableAudio,
    clearNotifications: stopTitleBlink
  };
};