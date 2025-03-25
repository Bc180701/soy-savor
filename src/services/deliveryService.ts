
import { supabase } from "@/integrations/supabase/client";

export const checkPostalCodeDelivery = async (postalCode: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('delivery_locations')
    .select('*')
    .eq('postal_code', postalCode)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    console.error("Error checking postal code:", error);
    return false;
  }
  
  return true;
};

export const getDeliveryLocations = async (): Promise<{city: string, postalCode: string}[]> => {
  const { data, error } = await supabase
    .from('delivery_locations')
    .select('city, postal_code')
    .eq('is_active', true)
    .order('city', { ascending: true });
  
  if (error || !data) {
    console.error("Error fetching delivery locations:", error);
    return [];
  }
  
  return data.map(location => ({
    city: location.city,
    postalCode: location.postal_code
  }));
};

export const calculateDeliveryFee = (subtotal: number): number => {
  // Free delivery for orders >= 30€
  return subtotal >= 30 ? 0 : 3;
};
