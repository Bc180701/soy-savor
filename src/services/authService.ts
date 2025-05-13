
import { supabase } from "@/integrations/supabase/client";

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('auth_users_view')
      .select('*');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { data: null, error };
  }
}

/**
 * Récupère les informations détaillées d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Informations du profil et adresses
 */
export async function getUserDetails(userId: string) {
  try {
    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    // Récupérer les adresses
    const { data: addresses, error: addressesError } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId);
    
    if (addressesError) {
      throw addressesError;
    }
    
    return { 
      profile: profile || null, 
      addresses: addresses || [],
      error: null 
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { profile: null, addresses: [], error };
  }
}
