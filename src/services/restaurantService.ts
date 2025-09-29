
import { supabase } from "@/integrations/supabase/client";
import { Restaurant } from "@/types/restaurant";

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  console.log("Fetching all restaurants");
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error("Error fetching restaurants:", error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} restaurants`);
    
    // Convertir les données Supabase vers notre type Restaurant
    return (data || []).map(restaurant => ({
      ...restaurant,
      settings: (restaurant.settings as Record<string, any>) || {}
    }));
  } catch (error) {
    console.error("Exception in fetchRestaurants:", error);
    return [];
  }
};

export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
  console.log(`Fetching restaurant with ID: ${id}`);
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching restaurant:", error);
      throw error;
    }
    
    // Convertir les données Supabase vers notre type Restaurant
    return {
      ...data,
      settings: (data.settings as Record<string, any>) || {}
    };
  } catch (error) {
    console.error("Exception in getRestaurantById:", error);
    return null;
  }
};

// IDs par défaut des restaurants
export const RESTAURANTS = {
  CHATEAURENARD: '11111111-1111-1111-1111-111111111111',
  ST_MARTIN_DE_CRAU: '22222222-2222-2222-2222-222222222222'
} as const;
