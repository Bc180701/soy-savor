
import { supabase } from "@/integrations/supabase/client";
import { Restaurant } from "@/types/restaurant";

export const fetchRestaurants = async (): Promise<Restaurant[]> => {
  console.log("Fetching all restaurants");
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .order('name');
  
  if (error) {
    console.error("Error fetching restaurants:", error);
    return [];
  }
  
  console.log(`Found ${data?.length || 0} restaurants`);
  
  // Convertir les données Supabase vers notre type Restaurant
  return (data || []).map(restaurant => ({
    ...restaurant,
    settings: restaurant.settings as Record<string, any> || {}
  }));
};

export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
  console.log(`Fetching restaurant with ID: ${id}`);
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error("Error fetching restaurant:", error);
    return null;
  }
  
  // Convertir les données Supabase vers notre type Restaurant
  return {
    ...data,
    settings: data.settings as Record<string, any> || {}
  };
};

// IDs par défaut des restaurants
export const RESTAURANTS = {
  CHATEAURENARD: '11111111-1111-1111-1111-111111111111',
  ST_MARTIN_DE_CRAU: '22222222-2222-2222-2222-222222222222'
} as const;
