
import { useState, useEffect } from 'react';
import { 
  checkDayBasedPromotions, 
  getActivePromotionForCategory, 
  getActivePromotionForProduct,
  DayBasedPromotion,
  isPromotionActiveToday 
} from '@/services/promotionService';
import { useRestaurantContext } from '@/hooks/useRestaurantContext';

export const usePromotions = () => {
  const [activePromotions, setActivePromotions] = useState<DayBasedPromotion[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { currentRestaurant } = useRestaurantContext();

  useEffect(() => {
    const updatePromotions = async () => {
      const promotions = await checkDayBasedPromotions(currentRestaurant?.id);
      setActivePromotions(promotions);
      setLastUpdate(new Date());
      console.log(`Promotions mises à jour pour restaurant ${currentRestaurant?.id || 'tous'}: ${promotions.length} promotion(s) active(s)`);
    };

    // Mise à jour immédiate
    updatePromotions();

    // Mise à jour toutes les minutes pour vérifier les changements d'heure
    const interval = setInterval(updatePromotions, 60000);

    return () => clearInterval(interval);
  }, [currentRestaurant?.id]);

  const getPromotionForCategory = async (category: string) => {
    return await getActivePromotionForCategory(category, currentRestaurant?.id);
  };

  const getPromotionForProduct = async (productId: string, category: string) => {
    return await getActivePromotionForProduct(productId, category, currentRestaurant?.id);
  };

  const isPromotionActive = async (promotionId: string) => {
    return await isPromotionActiveToday(promotionId);
  };

  return {
    activePromotions,
    getPromotionForCategory,
    getPromotionForProduct,
    isPromotionActive,
    lastUpdate
  };
};
