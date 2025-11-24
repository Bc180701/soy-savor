
import { supabase } from "@/integrations/supabase/client";

export const checkPostalCodeDelivery = async (postalCode: string, restaurantId?: string): Promise<boolean> => {
  try {
    console.log("🚚 Vérification code postal:", postalCode, "pour restaurant:", restaurantId);
    
    if (!restaurantId) {
      console.log("⚠️ Aucun restaurant spécifié pour la vérification du code postal");
      return false;
    }
    
    const { data, error } = await supabase
      .from('delivery_locations')
      .select('*')
      .eq('postal_code', postalCode)
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .limit(1); // Limiter à 1 résultat pour éviter les doublons
    
    console.log("🚚 Résultat vérification pour restaurant", restaurantId, ":", { data, error, count: data?.length });
    
    if (error) {
      console.error("❌ Erreur lors de la vérification du code postal:", error);
      return false;
    }
    
    const isValid = data && data.length > 0;
    console.log("✅ Code postal", postalCode, isValid ? "accepté" : "refusé", "pour restaurant", restaurantId);
    return isValid;
    
  } catch (error) {
    console.error("❌ Erreur inattendue lors de la vérification du code postal:", error);
    return false;
  }
};

export const getDeliveryLocations = async (restaurantId?: string): Promise<{city: string, postalCode: string}[]> => {
  try {
    console.log("📍 Récupération zones de livraison pour restaurant ID:", restaurantId);
    
    if (!restaurantId) {
      console.log("⚠️ Aucun restaurant spécifié - retour tableau vide");
      return [];
    }
    
    // Requête avec DISTINCT pour éviter les doublons
    const { data, error } = await supabase
      .from('delivery_locations')
      .select('city, postal_code, restaurant_id')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('city', { ascending: true });
    
    console.log("📍 Requête zones pour restaurant", restaurantId);
    console.log("📍 Résultat brut:", { data, error });
    
    if (error) {
      console.error("❌ Erreur Supabase lors de la récupération des zones:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log("⚠️ Aucune zone de livraison trouvée pour le restaurant", restaurantId);
      
      // Vérifier si le restaurant existe
      const { data: restaurantCheck } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('id', restaurantId);
      
      console.log("🏪 Vérification existence restaurant:", restaurantCheck);
      return [];
    }
    
    // Créer un Map pour éviter les doublons côté client aussi
    const uniqueZones = new Map();
    data.forEach(location => {
      const key = `${location.city}-${location.postal_code}`;
      if (!uniqueZones.has(key)) {
        uniqueZones.set(key, {
          city: location.city,
          postalCode: location.postal_code
        });
      }
    });
    
    const zones = Array.from(uniqueZones.values());
    
    console.log("🌍 Zones formatées (sans doublons) pour restaurant", restaurantId, ":", zones);
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
    const upperCode = code.toUpperCase();
    
    console.log("🔍 validatePromoCode appelé avec:", { code: upperCode, email, hasEmail: !!email });
    
    // D'abord vérifier dans promotion_codes (système simple)
    const { data: promotionCode, error: promoCodeError } = await supabase
      .from('promotion_codes')
      .select('*')
      .eq('code', upperCode)
      .eq('is_active', true)
      .maybeSingle();

    if (promotionCode) {
      console.log("💳 Code promo trouvé dans promotion_codes:", promotionCode);
      
      // TOUJOURS vérifier l'usage dans promo_code_usage si email fourni
      if (email) {
        const { data: usage, error: usageError } = await supabase
          .from('promo_code_usage')
          .select('*')
          .eq('promo_code', upperCode)
          .eq('user_email', email)
          .maybeSingle();

        console.log("🔍 Vérification usage pour email", email, ":", { usage, usageError });

        if (usage) {
          console.log("❌ BLOCAGE: Code déjà utilisé par cet email!");
          return { 
            valid: false, 
            message: "Vous avez déjà utilisé ce code promo avec cette adresse email" 
          };
        }
        
        console.log("✅ Aucun usage trouvé, code valide pour cet email");
      }

      // Vérifier la limite d'usage globale
      if (promotionCode.usage_limit && promotionCode.used_count >= promotionCode.usage_limit) {
        return { 
          valid: false, 
          message: "Ce code promo a atteint sa limite d'utilisation" 
        };
      }

      return {
        valid: true,
        discount: promotionCode.discount_percentage,
        isPercentage: true,
        message: "Code promo appliqué avec succès"
      };
    }

    // Sinon vérifier dans promotions (système avancé avec dates)
    const { data: promotion, error: promotionError } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', upperCode)
      .maybeSingle();

    if (promotionError || !promotion) {
      console.error("Error validating promo code:", promotionError);
      return { valid: false, message: "Code promo invalide" };
    }
    
    console.log("💳 Code promo trouvé dans promotions:", promotion);
    
    // Vérifier les dates
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    
    if (now < startDate || now > endDate) {
      return { valid: false, message: "Ce code promo a expiré ou n'est pas encore actif" };
    }

    // Vérifier l'usage unique si applicable
    if (promotion.is_one_time_use === true && email) {
      const { data: usageData, error: usageError } = await supabase
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code', upperCode)
        .eq('user_email', email);
      
      console.log("🔍 Vérification usage pour email", email, ":", { usageData, usageError });
      
      if (usageData && usageData.length > 0) {
        return { 
          valid: false, 
          message: "Vous avez déjà utilisé ce code promo" 
        };
      }
    }
    
    return { 
      valid: true, 
      discount: promotion.discount, 
      isPercentage: promotion.is_percentage,
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
