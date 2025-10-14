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

          // 🔄 Charger les cart_backup
          console.log("📦 Chargement des cart_backup pour toutes les commandes...");
          const ordersWithCartBackup = await Promise.all(
            verifiedOrders.map(async (order) => {
              if (!order.clientEmail) return order;

              try {
                const { data, error } = await supabase
                  .from("cart_backup")
                  .select("cart_items")
                  .eq("session_id", order.clientEmail)
                  .eq("is_used", false)
                  .order("created_at", { ascending: false })
                  .limit(1); // ✅ On garde le dernier enregistrement sans .single()

                const cartData = data?.[0];

                if (!error && cartData && cartData.cart_items) {
                  console.log(`✅ cart_backup chargé pour commande ${order.id.slice(-8)}`);
                  const cartItems = Array.isArray(cartData.cart_items)
                    ? cartData.cart_items
                    : [];
                  return { ...order, cartBackupItems: cartItems };
                }
              } catch (error) {
                console.log(`⚠️ Aucun cart_backup pour commande ${order.id.slice(-8)}`);
              }

              return order;
            })
          );

          setOrders(ordersWithCartBackup);
          setCachedOrders(ordersWithCartBackup, restId);
          setError(null);

          const cartBackupCount = ordersWithCartBackup.filter((o) => o.cartBackupItems).length;
          console.log(
            `✅ ${verifiedOrders.length} commandes validées (${cartBackupCount} avec cart_backup)`
          );

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
