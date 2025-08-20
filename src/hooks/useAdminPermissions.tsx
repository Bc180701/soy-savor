import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Cache local avec timestamp pour éviter les appels répétitifs
interface PermissionCache {
  isSuperAdmin: boolean;
  permissions: Record<string, boolean>;
  timestamp: number;
  userId: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RPC_TIMEOUT = 8000; // 8 secondes timeout

export function useAdminPermissions() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const checkingRef = useRef(false);

  // Cache local pour éviter les appels répétitifs
  const getCachedPermissions = useCallback((userId: string): PermissionCache | null => {
    try {
      const cached = localStorage.getItem(`admin_permissions_${userId}`);
      if (cached) {
        const parsedCache: PermissionCache = JSON.parse(cached);
        const isValid = Date.now() - parsedCache.timestamp < CACHE_DURATION;
        if (isValid && parsedCache.userId === userId) {
          console.log('📦 Permissions trouvées en cache pour:', userId);
          return parsedCache;
        }
      }
    } catch (error) {
      console.warn('Erreur lecture cache permissions:', error);
    }
    return null;
  }, []);

  const setCachedPermissions = useCallback((userId: string, isSuperAdmin: boolean, permissions: Record<string, boolean>) => {
    try {
      const cache: PermissionCache = {
        isSuperAdmin,
        permissions,
        timestamp: Date.now(),
        userId
      };
      localStorage.setItem(`admin_permissions_${userId}`, JSON.stringify(cache));
    } catch (error) {
      console.warn('Erreur sauvegarde cache permissions:', error);
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    // Éviter les appels concurrents
    if (checkingRef.current) {
      console.log('🔄 Vérification déjà en cours, ignorée');
      return;
    }

    checkingRef.current = true;
    setError(null);

    try {
      // Annuler la requête précédente si elle existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      console.log('🔐 Vérification des permissions admin...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ Aucun utilisateur connecté');
        setLoading(false);
        checkingRef.current = false;
        return;
      }

      // Vérifier le cache d'abord
      const cached = getCachedPermissions(user.id);
      if (cached) {
        setIsSuperAdmin(cached.isSuperAdmin);
        setPermissions(cached.permissions);
        setLoading(false);
        checkingRef.current = false;
        return;
      }

      console.log('🔍 Vérification RPC super-admin pour:', user.email);

      // Vérifier si l'utilisateur est super-administrateur avec timeout
      const superAdminPromise = supabase.rpc('is_super_admin', { user_id: user.id });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout RPC super-admin')), RPC_TIMEOUT)
      );

      let isSuperAdminResult = false;
      try {
        const { data, error: superAdminError } = await Promise.race([superAdminPromise, timeoutPromise]) as any;
        
        if (signal.aborted) return;
        
        if (superAdminError) {
          console.warn('⚠️ Erreur RPC super-admin:', superAdminError.message);
          // Fallback: vérifier directement dans user_roles
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'super_administrateur')
            .single();
          
          isSuperAdminResult = !!roleData;
          console.log('🔄 Fallback role check:', isSuperAdminResult ? 'Super Admin' : 'Admin normal');
        } else {
          isSuperAdminResult = !!data;
        }
      } catch (error: any) {
        console.warn('⚠️ Timeout ou erreur super-admin:', error.message);
        // Fallback silencieux
        isSuperAdminResult = false;
      }

      setIsSuperAdmin(isSuperAdminResult);

      let userPermissions: Record<string, boolean> = {};

      // Si pas super-admin, récupérer les permissions spécifiques
      if (!isSuperAdminResult) {
        try {
          const { data: permissionsData, error: permissionsError } = await supabase
            .from('admin_permissions')
            .select('section_name, can_access')
            .eq('admin_user_id', user.id)
            .abortSignal(signal);

          if (signal.aborted) return;

          if (permissionsError) {
            console.warn('⚠️ Erreur récupération permissions:', permissionsError.message);
          } else {
            permissionsData?.forEach(permission => {
              userPermissions[permission.section_name] = permission.can_access;
            });
          }
        } catch (error: any) {
          console.warn('⚠️ Erreur permissions:', error.message);
        }
      }

      setPermissions(userPermissions);
      
      // Sauvegarder en cache
      setCachedPermissions(user.id, isSuperAdminResult, userPermissions);
      
      console.log('✅ Permissions chargées:', { 
        isSuperAdmin: isSuperAdminResult, 
        permissions: Object.keys(userPermissions).length,
        email: user.email 
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('💥 Erreur critique permissions:', error);
        setError(error.message || 'Erreur de vérification des permissions');
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
        checkingRef.current = false;
      }
    }
  }, [getCachedPermissions, setCachedPermissions]);

  const clearCache = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('admin_permissions_'));
      keys.forEach(key => localStorage.removeItem(key));
      console.log('🗑️ Cache permissions vidé');
    } catch (error) {
      console.warn('Erreur vidage cache:', error);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
    
    // Écouter les changements de permissions via un événement personnalisé
    const handlePermissionsChanged = (event: CustomEvent) => {
      console.log('🔄 Événement permissions changées reçu:', event.detail);
      // Invalider le cache et recharger les permissions
      clearCache();
      // Délai court pour laisser la base de données se synchroniser
      setTimeout(() => {
        checkPermissions();
      }, 300);
    };

    window.addEventListener('admin-permissions-changed', handlePermissionsChanged as EventListener);
    
    // Nettoyage à la désactivation
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      window.removeEventListener('admin-permissions-changed', handlePermissionsChanged as EventListener);
    };
  }, [checkPermissions]); // Retirer clearCache des dépendances car useCallback sans deps

  const canAccessSection = useCallback((sectionName: string): boolean => {
    // En cas d'erreur, donner accès par défaut pour éviter le blocage
    if (error) {
      console.warn('⚠️ Accès autorisé par défaut due à une erreur:', error);
      return true;
    }
    
    // Les super-admins ont accès à tout
    if (isSuperAdmin) return true;
    
    // Si aucune permission spécifique n'est définie, l'accès est autorisé par défaut
    if (!(sectionName in permissions)) return true;
    
    // Sinon, vérifier la permission spécifique
    return permissions[sectionName];
  }, [isSuperAdmin, permissions, error]);

  return {
    isSuperAdmin,
    canAccessSection,
    loading,
    error,
    refreshPermissions: checkPermissions,
    clearCache
  };
}