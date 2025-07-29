import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminPermissions() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Vérifier si l'utilisateur est super-administrateur
      const { data: isSuperAdminResult, error: superAdminError } = await supabase
        .rpc('is_super_admin', { user_id: user.id });

      if (superAdminError) {
        console.error('Erreur lors de la vérification du statut super-admin:', superAdminError);
      } else {
        setIsSuperAdmin(!!isSuperAdminResult);
      }

      // Si super-admin, pas besoin de vérifier les permissions spécifiques
      if (isSuperAdminResult) {
        setLoading(false);
        return;
      }

      // Récupérer les permissions spécifiques de l'utilisateur
      const { data: userPermissions, error: permissionsError } = await supabase
        .from('admin_permissions')
        .select('section_name, can_access')
        .eq('admin_user_id', user.id);

      if (permissionsError) {
        console.error('Erreur lors de la récupération des permissions:', permissionsError);
      } else {
        const permissionsMap: Record<string, boolean> = {};
        userPermissions?.forEach(permission => {
          permissionsMap[permission.section_name] = permission.can_access;
        });
        setPermissions(permissionsMap);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAccessSection = (sectionName: string): boolean => {
    // Les super-admins ont accès à tout
    if (isSuperAdmin) return true;
    
    // Si aucune permission spécifique n'est définie, l'accès est autorisé par défaut
    if (!(sectionName in permissions)) return true;
    
    // Sinon, vérifier la permission spécifique
    return permissions[sectionName];
  };

  return {
    isSuperAdmin,
    canAccessSection,
    loading,
    refreshPermissions: checkPermissions
  };
}