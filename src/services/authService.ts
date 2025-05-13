
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

    // Récupérer les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, total, status, payment_status')
      .eq('user_id', userId);
      
    if (ordersError) {
      throw ordersError;
    }
    
    return { 
      profile: profile || null, 
      addresses: addresses || [],
      orders: orders || [],
      error: null 
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { profile: null, addresses: [], orders: [], error };
  }
}

/**
 * Exporte les données des utilisateurs au format CSV
 * @returns Les données formatées pour CSV
 */
export async function exportUsersData() {
  try {
    // Récupérer tous les utilisateurs
    const { data: authUsers, error: authUsersError } = await getAllUsers();
    
    if (authUsersError || !authUsers) {
      throw authUsersError || new Error("Aucun utilisateur trouvé");
    }
    
    // Récupérer tous les profils
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");
      
    if (profilesError) {
      throw profilesError;
    }
    
    // Récupérer toutes les adresses
    const { data: addresses, error: addressesError } = await supabase
      .from("user_addresses")
      .select("*");
      
    if (addressesError) {
      throw addressesError;
    }
    
    // Récupérer toutes les commandes
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("user_id, total, created_at, status");
      
    if (ordersError) {
      throw ordersError;
    }
    
    // Fusionner les données
    const enrichedUsers = authUsers.map((authUser: any) => {
      const profile = profiles?.find(p => p.id === authUser.id) || {
        first_name: "",
        last_name: "",
        phone: "",
        loyalty_points: 0
      };
      
      // Trouver les adresses de cet utilisateur
      const userAddresses = addresses?.filter(a => a.user_id === authUser.id) || [];
      
      // Trouver les commandes de cet utilisateur
      const userOrders = orders?.filter(o => o.user_id === authUser.id) || [];
      
      // Calculer le montant total des achats
      const totalSpent = userOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
      
      // Adresse principale (par défaut ou première)
      const defaultAddress = userAddresses.length > 0 ? 
        userAddresses.find(addr => addr.is_default) || userAddresses[0] : null;
      
      return {
        id: authUser.id,
        email: authUser.email || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        addresses: userAddresses,
        defaultAddress,
        created_at: authUser.created_at || new Date().toISOString(),
        last_sign_in_at: authUser.last_sign_in_at || null,
        loyalty_points: profile.loyalty_points || 0,
        totalOrders: userOrders.length,
        totalSpent: totalSpent
      };
    });
    
    return { data: enrichedUsers, error: null };
  } catch (error) {
    console.error("Error exporting users data:", error);
    return { data: null, error };
  }
}
