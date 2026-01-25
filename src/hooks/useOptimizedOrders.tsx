import { useState, useEffect, useCallback, useRef } from "react";
import { getAllOrders } from "@/services/orderService";
import { Order } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OrdersCache {
  orders: Order[];
  timestamp: number;
  restaurantId: string | null;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 min
const DEBOUNCE_DELAY = 300; // 0,3s

export function useOptimizedOrders(restaurantId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);
  const cacheMapRef = useRef<Map<string, OrdersCache>>(new Map());
  const currentRestaurantRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCachedOrders = useCallback((restId: string | null): OrdersCache | null => {
    const cacheKey = restId || "all_restaurants";
    const cached = cacheMapRef.current.get(cacheKey);

    if (cached) {
      const isValid = Date.now() - cached.timestamp < CACHE_DURATION;
      if (isValid) {
        console.log("📦 Commandes trouvées en cache pour:", restId || "tous");
        return cached;
      } else {
        cacheMapRef.current.delete(cacheKey);
        console.log("🗑️ Cache expiré supprimé pour:", restId || "tous");
      }
    }
    return null;
  }, []);

  const setCachedOrders = useCallback((orders: Order[], restId: string | null) => {
    const cacheKey = restId || "all_restaurants";
    cacheMapRef.current.set(cacheKey, {
      orders,
      timestamp: Date.now(),
      restaurantId: restId,
    });
    console.log("💾 Cache mis à jour pour:", restId || "tous", "- Commandes:", orders.length);
  }, []);

  const fetchOrders = useCallback(
    async (restId: string | null, force = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log("🚫 Requête précédente annulée pour:", currentRestaurantRef.current || "tous");
      }

      abortControllerRef.current = new AbortController();
      currentRestaurantRef.current = restId;

      if (fetchingRef.current && !force) {
        console.log("🔄 Récupération déjà en cours, ignorée");
        return;
      }

      if (!force) {
        const cached = getCachedOrders(restId);
        if (cached) {
          const filteredFromCache = restId
            ? cached.orders.filter((order) => order.restaurant_id === restId)
            : cached.orders;

          if (filteredFromCache.length !== cached.orders.length && restId) {
            console.warn("⚠️ Cache contaminé détecté pour:", restId);
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
        console.log("🔍 [FETCH] Commandes pour:", restId || "tous");
        const startTime = performance.now();

        const { orders: fetchedOrders, error: fetchError } = await getAllOrders(restId);

        if (abortControllerRef.current?.signal.aborted) {
          console.log("🚫 Requête annulée pour:", restId || "tous");
          return;
        }

        const loadTime = Math.round(performance.now() - startTime);
        console.log(`⏱️ Commandes récupérées en ${loadTime}ms:`, fetchedOrders?.length || 0);

        if (fetchError) {
          console.error("❌ Erreur récupération commandes:", fetchError);
          setError(fetchError.message || "Erreur de récupération");
          toast({
            title: "Erreur",
            description: `Impossible de charger les commandes: ${fetchError.message || fetchError}`,
            variant: "destructive",
          });
        } else {
          const validOrders = fetchedOrders || [];

          const verifiedOrders = restId
            ? validOrders.filter((order) => {
                if (order.restaurant_id !== restId) {
                  console.error("🚨 COMMANDE MAL ATTRIBUÉE détectée:", {
                    orderId: order.id,
                    attendu: restId,
                    reçu: order.restaurant_id,
                    clientName: order.clientName,
                  });
                  return false;
                }
                return true;
              })
            : validOrders;

          if (verifiedOrders.length !== validOrders.length) {
            console.warn(
              `⚠️ ${validOrders.length - verifiedOrders.length} commande(s) mal attribuée(s) filtrée(s)`
            );
          }

           // 🔄 Charger tous les cart_backup et les associer par email + timestamp
           console.log("📦 Chargement global des cart_backup par email + timestamp...");

           const clientEmails = verifiedOrders
             .map(o => o.clientEmail)
             .filter(Boolean);

           let ordersWithCartBackup = [...verifiedOrders];

           if (clientEmails.length > 0) {
             try {
               const { data: cartBackups, error: cartError } = await supabase
                 .from("cart_backup")
                 .select("session_id, cart_items, created_at")
                 .in("session_id", clientEmails)
                 .order("created_at", { ascending: false });

               if (cartError) throw cartError;

               // Pour chaque commande, trouver le cart_backup le plus proche dans le temps
               ordersWithCartBackup = verifiedOrders.map(order => {
                 if (!order.clientEmail) return order;

                 // Filtrer les cart_backup de ce client
                 const clientBackups = cartBackups?.filter(cb => cb.session_id === order.clientEmail) || [];
                 
                 if (clientBackups.length === 0) return order;

                 // Trouver le backup le plus proche dans le temps (tolérance 5 min)
                 const orderTime = new Date(order.createdAt).getTime();
                 const matchingBackup = clientBackups.find(cb => {
                   const backupTime = new Date(cb.created_at).getTime();
                   return Math.abs(backupTime - orderTime) < 5 * 60 * 1000;
                 });

                 const cartItems = matchingBackup 
                   ? (Array.isArray(matchingBackup.cart_items) ? matchingBackup.cart_items : [])
                   : [];

                 return { ...order, cartBackupItems: cartItems };
               });

               const cartBackupCount = ordersWithCartBackup.filter(o => o.cartBackupItems?.length).length;
               console.log(`✅ ${verifiedOrders.length} commandes validées (${cartBackupCount} avec cart_backup par timestamp)`);
             } catch (err: any) {
               console.error("💥 Erreur récupération globale des cart_backup:", err);
               toast({
                 title: "Erreur cart_backup",
                 description: "Impossible de charger les articles des commandes",
                 variant: "destructive",
               });
             }
           }

          setOrders(ordersWithCartBackup);
          setCachedOrders(ordersWithCartBackup, restId);

          if (loadTime > 3000) {
            console.warn("🐌 Chargement lent:", loadTime + "ms");
          }
        }
      } catch (err: any) {
        console.error("💥 Exception récupération commandes:", err);
        setError(err.message || "Erreur inattendue");
        toast({
          title: "Erreur inattendue",
          description: "Une erreur est survenue lors du chargement des commandes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [toast, getCachedOrders, setCachedOrders]
  );

  const debouncedFetchOrders = useCallback(
    (restId: string | null, force = false) => {
      if (currentRestaurantRef.current !== restId) {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        if (abortControllerRef.current) abortControllerRef.current.abort();
        fetchOrders(restId, true);
        return;
      }

      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

      debounceTimeoutRef.current = setTimeout(() => {
        fetchOrders(restId, force);
      }, force ? 0 : DEBOUNCE_DELAY);
    },
    [fetchOrders]
  );

  const refreshOrders = useCallback(() => {
    console.log("🔄 Rafraîchissement forcé des commandes");
    debouncedFetchOrders(restaurantId, true);
  }, [restaurantId, debouncedFetchOrders]);

  const updateOrderLocally = useCallback(
    (orderId: string, updates: Partial<Order>) => {
      setOrders((currentOrders) => {
        const updatedOrders = currentOrders.map((order) =>
          order.id === orderId ? { ...order, ...updates } : order
        );
        setCachedOrders(updatedOrders, restaurantId);
        return updatedOrders;
      });
    },
    [restaurantId, setCachedOrders]
  );

  const clearCache = useCallback(() => {
    cacheMapRef.current.clear();
    console.log("🗑️ Cache commandes vidé complètement");
  }, []);

  useEffect(() => {
    if (restaurantId !== undefined) {
      console.log("🎯 Chargement des commandes pour:", restaurantId || "tous");
      debouncedFetchOrders(restaurantId);
    } else {
      console.log("⏳ Attente de l'initialisation du restaurant...");
    }

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [restaurantId, debouncedFetchOrders]);

  return {
    orders,
    loading,
    error,
    refreshOrders,
    updateOrderLocally,
    clearCache,
    isFromCache: !loading && !!getCachedOrders(restaurantId),
  };
}
