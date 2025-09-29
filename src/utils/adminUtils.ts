import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie si un utilisateur a des privilèges d'administration
 * (rôle 'administrateur' ou 'super_administrateur')
 */
export const checkAdminRole = async (userId: string): Promise<boolean> => {
  try {
    const [adminResult, superAdminResult] = await Promise.all([
      supabase.rpc('has_role', { user_id: userId, role: 'administrateur' }),
      supabase.rpc('has_role', { user_id: userId, role: 'super_administrateur' })
    ]);
    
    if (adminResult.error && superAdminResult.error) {
      throw adminResult.error || superAdminResult.error;
    }
    
    return !!adminResult.data || !!superAdminResult.data;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut admin:", error);
    return false;
  }
};

/**
 * Vérifie si un utilisateur a des privilèges de super administration
 */
export const checkSuperAdminRole = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_role', { 
      user_id: userId, 
      role: 'super_administrateur' 
    });
    
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut super admin:", error);
    return false;
  }
};