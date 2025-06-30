
import { supabase } from "@/integrations/supabase/client";

export const checkPostalCodeDelivery = async (postalCode: string, restaurantId?: string): Promise<boolean> => {
  try {
    console.log("🚚 Vérification code postal:", postalCode, "pour restaurant:", restaurantId);
    
    // Toujours faire une requête simple sans filtre restaurant d'abord
    const { data, error } = await supabase
      .from('delivery_locations')
      .select('*')
      .eq('postal_code', postalCode)
      .eq('is_active', true);
    
    console.log("🚚 Résultat requête simple:", { data, error });
    
    if (error) {
      console.error("❌ Erreur lors de la vérification du code postal:", error);
      return false;
    }
    
    // Si un restaurant est spécifié, filtrer les résultats
    if (restaurantId && data) {
      const filteredData = data.filter(location => location.restaurant_id === restaurantId);
      console.log("🚚 Données filtrées par restaurant:", filteredData);
      const isValid = filteredData.length > 0;
      console.log("✅ Code postal", postalCode, isValid ? "accepté" : "refusé", "pour restaurant", restaurantId);
      return isValid;
    }
    
    const isValid = data && data.length > 0;
    console.log("✅ Code postal", postalCode, isValid ? "accepté" : "refusé");
    return isValid;
    
  } catch (error) {
    console.error("❌ Erreur inattendue lors de la vérification du code postal:", error);
    return false;
  }
};

export const getDeliveryLocations = async (restaurantId?: string): Promise<{city: string, postalCode: string}[]> => {
  try {
    console.log("📍 Récupération zones de livraison pour restaurant:", restaurantId);
    
    // Faire une requête simple pour récupérer toutes les zones actives
    const { data, error } = await supabase
      .from('delivery_locations')
      .select('city, postal_code, restaurant_id')
      .eq('is_active', true)
      .order('city', { ascending: true });
    
    console.log("📍 Résultat zones brutes:", { data, error, count: data?.length });
    
    if (error) {
      console.error("❌ Erreur lors de la récupération des zones de livraison:", error);
      return [];
    }
    
    if (!data) {
      console.log("⚠️ Aucune donnée récupérée");
      return [];
    }
    
    // Si un restaurant est spécifié, filtrer par restaurant
    let filteredData = data;
    if (restaurantId) {
      filteredData = data.filter(location => location.restaurant_id === restaurantId);
      console.log("🏪 Zones filtrées pour restaurant", restaurantId, ":", filteredData.length, "zones");
    }
    
    const zones = filteredData.map(location => ({
      city: location.city,
      postalCode: location.postal_code
    }));
    
    console.log("🌍 Zones finales:", zones);
    return zones;
    
  } catch (error) {
    console.error("❌ Erreur inattendue lors de la récupération des zones:", error);
    return [];
  }
};

export const calculateDeliveryFee = (subtotal: number): number => {
  // Free delivery for orders >= 35€, otherwise 5€ delivery fee
  return subtotal >= 35 ? 0 : 5;
};

// Enhanced promo code validation with single-use per email check
export const validatePromoCode = async (code: string, email?: string): Promise<{ 
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

    // Check if the promo code has a one-time use restriction and if email is provided
    if (data.is_one_time_use === true && email) {
      // Check if this user has already used this promo code
      const { data: usageData, error: usageError } = await supabase
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code', code.toUpperCase())
        .eq('user_email', email);
      
      if (usageData && usageData.length > 0) {
        return { 
          valid: false, 
          message: "Vous avez déjà utilisé ce code promo" 
        };
      }
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

// Track the usage of a promo code by a specific email
export const recordPromoCodeUsage = async (code: string, email: string): Promise<boolean> => {
  try {
    // Insert record of promo code usage
    const { error } = await supabase
      .from('promo_code_usage')
      .insert({ 
        promo_code: code.toUpperCase(),
        user_email: email
      });
    
    if (error) {
      console.error("Error recording promo code usage:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error recording promo code usage:", error);
    return false;
  }
};
