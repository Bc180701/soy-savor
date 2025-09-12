import { useState, useEffect, useCallback, useRef } from "react";
import { getAllOrders } from "@/services/orderService";
import { Order } from "@/types";
import { useToast } from "@/components/ui/use-toast";

// Cache local avec timestamp pour éviter les recharges répétitives - ISOLÉ PAR RESTAURANT
interface OrdersCache {
  orders: Order[];
  timestamp: number;
  restaurantId: string | null;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const DEBOUNCE_DELAY = 300; // Réduit à 300ms pour plus de réactivité

export function useOptimizedOrders(restaurantId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);
  const cacheMapRef = useRef<Map<string, OrdersCache>>(new Map()); // Cache isolé par restaurant
  const currentRestaurantRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fonction pour obtenir le cache ISOLÉ par restaurant
  const getCachedOrders = useCallback((restId: string | null): OrdersCache | null => {
    const cacheKey = restId || 'all_restaurants';
    const cached = cacheMapRef.current.get(cacheKey);
    
    if (cached) {
      const isValid = Date.now() - cached.timestamp < CACHE_DURATION;
      if (isValid) {
        console.log('📦 Commandes trouvées en cache pour restaurant:', restId || 'tous');
        return cached;
      } else {
        // Supprimer le cache expiré
        cacheMapRef.current.delete(cacheKey);
        console.log('🗑️ Cache expiré supprimé pour restaurant:', restId || 'tous');
      }
    }
    return null;
  }, []);

  // Fonction pour mettre en cache ISOLÉ par restaurant
  const setCachedOrders = useCallback((orders: Order[], restId: string | null) => {
    const cacheKey = restId || 'all_restaurants';
    cacheMapRef.current.set(cacheKey, {
      orders,
      timestamp: Date.now(),
      restaurantId: restId
    });
    console.log('💾 Cache mis à jour pour restaurant:', restId || 'tous', '- Commandes:', orders.length);
  }, []);

  const fetchOrders = useCallback(async (restId: string | null, force = false) => {
    // ANNULER les requêtes précédentes pour éviter les race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🚫 Requête précédente annulée pour restaurant:', currentRestaurantRef.current || 'tous');
    }
    
    // Créer un nouveau controller pour cette requête
    abortControllerRef.current = new AbortController();
    currentRestaurantRef.current = restId;

    // Éviter les appels concurrents pour le même restaurant
    if (fetchingRef.current && !force) {
      console.log('🔄 Récupération déjà en cours, ignorée');
      return;
    }

    // Vérifier le cache d'abord (sauf si forcé)
    if (!force) {
      const cached = getCachedOrders(restId);
      if (cached) {
        // VALIDATION: vérifier que les commandes correspondent au restaurant
        const filteredFromCache = restId 
          ? cached.orders.filter(order => order.restaurant_id === restId)
          : cached.orders;
        
        if (filteredFromCache.length !== cached.orders.length && restId) {
          console.warn('⚠️ Cache contaminé détecté pour restaurant:', restId, 'Nettoyage nécessaire');
          cacheMapRef.current.delete(restId);
        } else {
          setOrders(filteredFromCache);
          setLoading(false);
          setError(null);
          return;
        }
      }
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [FETCH] Récupération commandes pour restaurant:', restId || 'tous');
      const startTime = performance.now();
      
      const { orders: fetchedOrders, error: fetchError } = await getAllOrders(restId);
      
      // Vérifier si la requête a été annulée
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🚫 Requête annulée pour restaurant:', restId || 'tous');
        return;
      }
      
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
        
        // VALIDATION CLIENT: vérifier que les commandes correspondent au restaurant attendu
        const verifiedOrders = restId 
          ? validOrders.filter(order => {
              if (order.restaurant_id !== restId) {
                console.error('🚨 COMMANDE MAL ATTRIBUÉE détectée:', {
                  orderId: order.id,
                  attendu: restId,
                  reçu: order.restaurant_id,
                  clientName: order.clientName
                });
                return false;
              }
              return true;
            })
          : validOrders;
        
        if (verifiedOrders.length !== validOrders.length) {
          console.warn(`⚠️ ${validOrders.length - verifiedOrders.length} commande(s) mal attribuée(s) filtrée(s)`);
        }
        
        setOrders(verifiedOrders);
        setCachedOrders(verifiedOrders, restId);
        setError(null);
        
        console.log(`✅ ${verifiedOrders.length} commandes validées pour restaurant:`, restId || 'tous');
        
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

  // Fonction pour rafraîchir les commandes avec debounce OPTIMISÉ
  const debouncedFetchOrders = useCallback((restId: string | null, force = false) => {
    // Annuler immédiatement si changement de restaurant
    if (currentRestaurantRef.current !== restId) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Exécution immédiate pour les changements de restaurant
      fetchOrders(restId, true);
      return;
    }

    // Annuler le timer précédent pour le même restaurant
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
    console.log('🗑️ AVANT - Cache keys:', Array.from(cacheMapRef.current.keys()));
    cacheMapRef.current.clear();
    console.log('🗑️ Cache commandes vidé complètement');
    console.log('🗑️ APRÈS - Cache keys:', Array.from(cacheMapRef.current.keys()));
    
    // Forcer un rechargement immédiat après vidage du cache
    console.log('🔄 Rechargement forcé après vidage cache pour restaurant:', restaurantId);
    setTimeout(() => {
      fetchOrders(restaurantId, true);
    }, 100);
  }, [restaurantId, fetchOrders]);

  // Effect principal pour charger les commandes
  useEffect(() => {
    // Attendre que restaurantId soit défini (ne pas charger pendant l'initialisation)
    if (restaurantId !== undefined) { // null est une valeur valide (tous les restaurants)
      console.log('🎯 Chargement des commandes pour restaurant initialisé:', restaurantId || 'tous');
      debouncedFetchOrders(restaurantId);
    } else {
      console.log('⏳ Attente de l\'initialisation du restaurant...');
    }

    // Nettoyage COMPLET
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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