import { useState, useEffect, useRef } from 'react';
import { MenuCategory } from '@/types';
import { getCarteMenuData } from '@/services/productService';

interface CacheEntry {
  data: MenuCategory[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cacheRef: { current: CacheEntry | null } = { current: null };

export const useCarteMenuData = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isValidCache = (cache: CacheEntry | null): boolean => {
    if (!cache) return false;
    return Date.now() - cache.timestamp < CACHE_DURATION;
  };

  const fetchData = async (useCache = true) => {
    // Check cache first
    if (useCache && isValidCache(cacheRef.current)) {
      setCategories(cacheRef.current!.data);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCarteMenuData();
      
      // Update cache
      cacheRef.current = {
        data,
        timestamp: Date.now()
      };
      
      setCategories(data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Erreur lors du chargement des données de la carte:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchData(false);
  };

  const clearCache = () => {
    cacheRef.current = null;
  };

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    categories,
    loading,
    error,
    refreshData,
    clearCache,
    isFromCache: isValidCache(cacheRef.current)
  };
};