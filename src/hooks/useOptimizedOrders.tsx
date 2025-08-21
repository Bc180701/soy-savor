import { useState, useEffect, useCallback, useRef } from "react";
import { getAllOrders } from "@/services/orderService";
import { Order } from "@/types";
import { useToast } from "@/components/ui/use-toast";

// Cache local avec timestamp pour éviter les recharges répétitives
interface OrdersCache {
  orders: Order[];
  timestamp: number;
  restaurantId: string | null;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const DEBOUNCE_DELAY = 500; // 500ms de debounce

export function useOptimizedOrders(restaurantId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);
  const cacheRef = useRef<OrdersCache | null>(null);

  // Fonction pour obtenir le cache
  const getCachedOrders = useCallback((restId: string | null): OrdersCache | null => {
    if (cacheRef.current) {
      const { orders, timestamp, restaurantId: cachedRestId } = cacheRef.current;
      const isValid = Date.now() - timestamp < CACHE_DURATION;
      const isSameRestaurant = cachedRestId === restId;
      
      if (isValid && isSameRestaurant) {
        console.log('📦 Commandes trouvées en cache pour restaurant:', restId || 'tous');
        return cacheRef.current;
      }
    }
    return null;
  }, []);

  // Fonction pour mettre en cache
  const setCachedOrders = useCallback((orders: Order[], restId: string | null) => {
    cacheRef.current = {
      orders,
      timestamp: Date.now(),
      restaurantId: restId
    };
  }, []);

  const fetchOrders = useCallback(async (restId: string | null, force = false) => {
    // Éviter les appels concurrents
    if (fetchingRef.current && !force) {
      console.log('🔄 Récupération déjà en cours, ignorée');
      return;
    }

    // Vérifier le cache d'abord (sauf si forcé)
    if (!force) {
      const cached = getCachedOrders(restId);
      if (cached) {
        setOrders(cached.orders);
        setLoading(false);
        setError(null);
        return;
      }
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Récupération commandes pour restaurant:', restId || 'tous');
      const startTime = performance.now();
      
      const { orders: fetchedOrders, error: fetchError } = await getAllOrders(restId);
      
      const loadTime = Math.round(performance.now() - startTime);
      console.log(`⏱️ Commandes récupérées en ${loadTime}ms:`, fetchedOrders?.length || 0);
      
      if (fetchError) {
        console.error('❌ Erreur récupération commandes:', fetchError);
        setError(fetchError.message || 'Erreur de récupération');
        toast({
          title: "Erreur",
          description: `Impossible de charger les commandes: ${fetchError.message || fetchError}`,
          variant: "destructive",
        });
      } else {
        const validOrders = fetchedOrders || [];
        setOrders(validOrders);
        setCachedOrders(validOrders, restId);
        setError(null);
        
        // Métriques de performance
        if (loadTime > 3000) {
          console.warn('🐌 Chargement lent détecté:', loadTime + 'ms');
        }
      }
    } catch (err: any) {
      console.error('💥 Exception récupération commandes:', err);
      setError(err.message || 'Erreur inattendue');
      toast({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors du chargement des commandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [toast, getCachedOrders, setCachedOrders]);

  // Fonction pour rafraîchir les commandes avec debounce
  const debouncedFetchOrders = useCallback((restId: string | null, force = false) => {
    // Annuler le timer précédent
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Créer un nouveau timer
    debounceTimeoutRef.current = setTimeout(() => {
      fetchOrders(restId, force);
    }, force ? 0 : DEBOUNCE_DELAY);
  }, [fetchOrders]);

  // Fonction pour forcer le rafraîchissement
  const refreshOrders = useCallback(() => {
    console.log('🔄 Rafraîchissement forcé des commandes');
    debouncedFetchOrders(restaurantId, true);
  }, [restaurantId, debouncedFetchOrders]);

  // Fonction pour mettre à jour une commande localement
  const updateOrderLocally = useCallback((orderId: string, updates: Partial<Order>) => {
    setOrders(currentOrders => {
      const updatedOrders = currentOrders.map(order => 
        order.id === orderId ? { ...order, ...updates } : order
      );
      
      // Mettre à jour le cache aussi
      setCachedOrders(updatedOrders, restaurantId);
      return updatedOrders;
    });
  }, [restaurantId, setCachedOrders]);

  // Fonction pour vider le cache
  const clearCache = useCallback(() => {
    cacheRef.current = null;
    console.log('🗑️ Cache commandes vidé');
  }, []);

  // Effect principal pour charger les commandes
  useEffect(() => {
    // Attendre que restaurantId soit défini (ne pas charger pendant l'initialisation)
    if (restaurantId !== undefined) { // null est une valeur valide (tous les restaurants)
      console.log('🎯 Chargement des commandes pour restaurant initialisé:', restaurantId || 'tous');
      debouncedFetchOrders(restaurantId);
    } else {
      console.log('⏳ Attente de l\'initialisation du restaurant...');
    }

    // Nettoyage
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [restaurantId, debouncedFetchOrders]);

  return {
    orders,
    loading,
    error,
    refreshOrders,
    updateOrderLocally,
    clearCache,
    isFromCache: !loading && !!getCachedOrders(restaurantId)
  };
}