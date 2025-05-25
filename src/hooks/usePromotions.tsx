
import { useState, useEffect } from 'react';
import { 
  checkDayBasedPromotions, 
  getActivePromotionForCategory, 
  DayBasedPromotion,
  isPromotionActiveToday 
} from '@/services/promotionService';

export const usePromotions = () => {
  const [activePromotions, setActivePromotions] = useState<DayBasedPromotion[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updatePromotions = () => {
      const promotions = checkDayBasedPromotions();
      setActivePromotions(promotions);
      setLastUpdate(new Date());
      console.log(`Promotions mises à jour: ${promotions.length} promotion(s) active(s)`);
    };

    // Mise à jour immédiate
    updatePromotions();

    // Mise à jour toutes les minutes pour vérifier les changements d'heure
    const interval = setInterval(updatePromotions, 60000);

    return () => clearInterval(interval);
  }, []);

  const getPromotionForCategory = (category: string) => {
    return getActivePromotionForCategory(category);
  };

  const isPromotionActive = (promotionId: string) => {
    return isPromotionActiveToday(promotionId);
  };

  return {
    activePromotions,
    getPromotionForCategory,
    isPromotionActive,
    lastUpdate
  };
};
