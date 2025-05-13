
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
