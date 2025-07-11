import { supabase } from "@/integrations/supabase/client";

export interface DayBasedPromotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  isPercentage: boolean;
  applicableDays: number[]; // 0 = dimanche, 1 = lundi, etc.
  applicableCategories?: string[];
  applicableProducts?: string[]; // IDs des produits spécifiques
  applicableRestaurants?: string[]; // IDs des restaurants, si vide = tous
  startTime?: string; // Format HH:MM
  endTime?: string; // Format HH:MM
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fonction pour récupérer toutes les promotions depuis la base de données
export const fetchDayBasedPromotions = async (): Promise<DayBasedPromotion[]> => {
  try {
    const { data, error } = await supabase
      .from('day_based_promotions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(promo => ({
      id: promo.id,
      title: promo.title,
      description: promo.description,
      discount: promo.discount,
      isPercentage: promo.is_percentage,
      applicableDays: promo.applicable_days,
      applicableCategories: promo.applicable_categories || [],
      applicableProducts: promo.applicable_products || [],
      applicableRestaurants: promo.applicable_restaurants || [],
      startTime: promo.start_time,
      endTime: promo.end_time,
      isActive: promo.is_active,
      createdAt: promo.created_at,
      updatedAt: promo.updated_at
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    return [];
  }
};

export const checkDayBasedPromotions = async (restaurantId?: string): Promise<DayBasedPromotion[]> => {
  const promotions = await fetchDayBasedPromotions();
  const now = new Date();
  const currentDay = now.getDay(); // 0 = dimanche, 1 = lundi, etc.
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  console.log(`🔍 Vérification des promotions - Jour: ${currentDay}, Heure: ${currentTime}, Restaurant: ${restaurantId}`);
  
  return promotions.filter(promotion => {
    // Vérifier si le jour actuel est dans les jours applicables
    const isDayApplicable = promotion.applicableDays.includes(currentDay);
    
    // Vérifier l'heure si définie
    let isTimeApplicable = true;
    if (promotion.startTime && promotion.endTime) {
      isTimeApplicable = currentTime >= promotion.startTime && currentTime <= promotion.endTime;
    }
    
    // Vérifier si la promotion s'applique au restaurant
    let isRestaurantApplicable = true;
    if (promotion.applicableRestaurants && promotion.applicableRestaurants.length > 0 && restaurantId) {
      isRestaurantApplicable = promotion.applicableRestaurants.includes(restaurantId);
    }
    
    const isActive = isDayApplicable && isTimeApplicable && isRestaurantApplicable;
    
    if (isActive) {
      console.log(`✅ Promotion active: ${promotion.title} pour restaurant ${restaurantId || 'tous'}`);
    }
    
    return isActive;
  });
};

export const getActivePromotionForCategory = async (category: string, restaurantId?: string): Promise<DayBasedPromotion | null> => {
  const activePromotions = await checkDayBasedPromotions(restaurantId);
  
  console.log(`🔍 Recherche promotion pour catégorie: ${category}, restaurant: ${restaurantId || 'tous'}`);
  console.log('Promotions actives:', activePromotions.length);
  
  // Normaliser la catégorie pour gérer les variations
  const normalizedCategory = category.toLowerCase();
  
  const matchingPromotion = activePromotions.find(promotion => {
    // Si des catégories spécifiques sont définies, vérifier si la catégorie correspond
    if (promotion.applicableCategories && promotion.applicableCategories.length > 0) {
      const categoryMatch = promotion.applicableCategories.some(cat => {
        const normalizedPromoCategory = cat.toLowerCase();
        // Gérer les variations comme "boissons", "boisson", "drinks"
        return normalizedPromoCategory === normalizedCategory || 
               (normalizedCategory === 'boissons' && normalizedPromoCategory === 'boisson') ||
               (normalizedCategory === 'boisson' && normalizedPromoCategory === 'boissons');
      });
      
      console.log(`🎯 Promotion ${promotion.title}: catégories applicables:`, promotion.applicableCategories, 'match:', categoryMatch);
      return categoryMatch;
    }
    
    // Si pas de catégories spécifiques, la promotion s'applique à toutes les catégories
    return true;
  });
  
  if (matchingPromotion) {
    console.log(`✅ Promotion trouvée pour catégorie ${category}:`, matchingPromotion.title);
  } else {
    console.log(`❌ Aucune promotion trouvée pour catégorie ${category}`);
  }
  
  return matchingPromotion || null;
};

export const getActivePromotionForProduct = async (productId: string, category: string, restaurantId?: string): Promise<DayBasedPromotion | null> => {
  const activePromotions = await checkDayBasedPromotions(restaurantId);
  
  console.log(`🔍 Recherche promotion pour produit: ${productId}, catégorie: ${category}, restaurant: ${restaurantId || 'tous'}`);
  
  return activePromotions.find(promotion => {
    // Vérifier si le produit spécifique est ciblé
    if (promotion.applicableProducts && promotion.applicableProducts.length > 0) {
      const productMatch = promotion.applicableProducts.includes(productId);
      console.log(`🎯 Promotion ${promotion.title}: produit match:`, productMatch);
      return productMatch;
    }
    
    // Sinon, vérifier par catégorie
    if (promotion.applicableCategories && promotion.applicableCategories.length > 0) {
      const normalizedCategory = category.toLowerCase();
      const categoryMatch = promotion.applicableCategories.some(cat => {
        const normalizedPromoCategory = cat.toLowerCase();
        return normalizedPromoCategory === normalizedCategory || 
               (normalizedCategory === 'boissons' && normalizedPromoCategory === 'boisson') ||
               (normalizedCategory === 'boisson' && normalizedPromoCategory === 'boissons');
      });
      console.log(`🎯 Promotion ${promotion.title}: catégorie match:`, categoryMatch);
      return categoryMatch;
    }
    
    // Si pas de restriction spécifique, s'applique à tout
    return true;
  }) || null;
};

export const calculatePromotionDiscount = (
  price: number, 
  promotion: DayBasedPromotion
): { discountedPrice: number; discountAmount: number } => {
  if (promotion.isPercentage) {
    const discountAmount = (price * promotion.discount) / 100;
    return {
      discountedPrice: price - discountAmount,
      discountAmount
    };
  } else {
    const discountAmount = Math.min(promotion.discount, price);
    return {
      discountedPrice: price - discountAmount,
      discountAmount
    };
  }
};

export const getDayName = (dayIndex: number): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayIndex] || 'Jour inconnu';
};

export const isPromotionActiveToday = async (promotionId: string): Promise<boolean> => {
  const activePromotions = await checkDayBasedPromotions();
  return activePromotions.some(promo => promo.id === promotionId);
};

// Fonctions CRUD pour l'administration
export const createPromotion = async (promotion: Omit<DayBasedPromotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<DayBasedPromotion | null> => {
  try {
    const { data, error } = await supabase
      .from('day_based_promotions')
      .insert({
        title: promotion.title,
        description: promotion.description,
        discount: promotion.discount,
        is_percentage: promotion.isPercentage,
        applicable_days: promotion.applicableDays,
        applicable_categories: promotion.applicableCategories || [],
        applicable_products: promotion.applicableProducts || [],
        applicable_restaurants: promotion.applicableRestaurants || [],
        start_time: promotion.startTime,
        end_time: promotion.endTime,
        is_active: promotion.isActive,
        restaurant_id: promotion.applicableRestaurants?.[0] || "11111111-1111-1111-1111-111111111111"
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      discount: data.discount,
      isPercentage: data.is_percentage,
      applicableDays: data.applicable_days,
      applicableCategories: data.applicable_categories || [],
      applicableProducts: data.applicable_products || [],
      applicableRestaurants: data.applicable_restaurants || [],
      startTime: data.start_time,
      endTime: data.end_time,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Erreur lors de la création de la promotion:', error);
    throw error;
  }
};

export const updatePromotion = async (id: string, promotion: Partial<Omit<DayBasedPromotion, 'id' | 'createdAt' | 'updatedAt'>>): Promise<DayBasedPromotion | null> => {
  try {
    const updateData: any = {};
    
    if (promotion.title !== undefined) updateData.title = promotion.title;
    if (promotion.description !== undefined) updateData.description = promotion.description;
    if (promotion.discount !== undefined) updateData.discount = promotion.discount;
    if (promotion.isPercentage !== undefined) updateData.is_percentage = promotion.isPercentage;
    if (promotion.applicableDays !== undefined) updateData.applicable_days = promotion.applicableDays;
    if (promotion.applicableCategories !== undefined) updateData.applicable_categories = promotion.applicableCategories;
    if (promotion.applicableProducts !== undefined) updateData.applicable_products = promotion.applicableProducts || [];
    if (promotion.applicableRestaurants !== undefined) updateData.applicable_restaurants = promotion.applicableRestaurants || [];
    if (promotion.startTime !== undefined) updateData.start_time = promotion.startTime;
    if (promotion.endTime !== undefined) updateData.end_time = promotion.endTime;
    if (promotion.isActive !== undefined) updateData.is_active = promotion.isActive;

    const { data, error } = await supabase
      .from('day_based_promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      discount: data.discount,
      isPercentage: data.is_percentage,
      applicableDays: data.applicable_days,
      applicableCategories: data.applicable_categories || [],
      applicableProducts: data.applicable_products || [],
      applicableRestaurants: data.applicable_restaurants || [],
      startTime: data.start_time,
      endTime: data.end_time,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la promotion:', error);
    throw error;
  }
};

export const deletePromotion = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('day_based_promotions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la promotion:', error);
    throw error;
  }
};

export const getAllPromotions = async (): Promise<DayBasedPromotion[]> => {
  try {
    const { data, error } = await supabase
      .from('day_based_promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(promo => ({
      id: promo.id,
      title: promo.title,
      description: promo.description,
      discount: promo.discount,
      isPercentage: promo.is_percentage,
      applicableDays: promo.applicable_days,
      applicableCategories: promo.applicable_categories || [],
      applicableProducts: promo.applicable_products || [],
      applicableRestaurants: promo.applicable_restaurants || [],
      startTime: promo.start_time,
      endTime: promo.end_time,
      isActive: promo.is_active,
      createdAt: promo.created_at,
      updatedAt: promo.updated_at
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error);
    return [];
  }
};
