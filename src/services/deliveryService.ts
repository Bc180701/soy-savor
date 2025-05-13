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
  // Free delivery for orders >= 30€, otherwise 3€ delivery fee
  return subtotal >= 30 ? 0 : 3;
};

// Add function to validate promo codes
export const validatePromoCode = async (code: string): Promise<{ 
  valid: boolean; 
  discount?: number; 
  isPercentage?: boolean;
  message?: string;
}> => {
  try {
    // Fetch promotion from database with this code
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    
    if (error || !data) {
      console.error("Error validating promo code:", error);
      return { valid: false, message: "Code promo invalide" };
    }
    
    // Check if the promotion is currently active
    const now = new Date();
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    if (now < startDate || now > endDate) {
      return { valid: false, message: "Ce code promo a expiré ou n'est pas encore actif" };
    }
    
    return { 
      valid: true, 
      discount: data.discount, 
      isPercentage: data.is_percentage,
      message: "Code promo appliqué avec succès"
    };
  } catch (error) {
    console.error("Error validating promo code:", error);
    return { valid: false, message: "Erreur lors de la validation du code promo" };
  }
};
