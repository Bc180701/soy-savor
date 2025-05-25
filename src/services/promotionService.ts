
export interface DayBasedPromotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  isPercentage: boolean;
  applicableDays: number[]; // 0 = dimanche, 1 = lundi, etc.
  applicableCategories?: string[];
  startTime?: string; // Format HH:MM
  endTime?: string; // Format HH:MM
}

// Définir les promotions basées sur les jours
export const DAY_BASED_PROMOTIONS: DayBasedPromotion[] = [
  {
    id: "box-du-midi-weekdays",
    title: "Box du Midi à -20%",
    description: "Du mardi au vendredi, profitez de -20% sur nos box du midi !",
    discount: 20,
    isPercentage: true,
    applicableDays: [2, 3, 4, 5], // Mardi à vendredi (2 = mardi, 3 = mercredi, 4 = jeudi, 5 = vendredi)
    applicableCategories: ["box_du_midi"],
    startTime: "11:30",
    endTime: "14:30"
  }
];

export const checkDayBasedPromotions = (): DayBasedPromotion[] => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = dimanche, 1 = lundi, etc.
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  console.log(`Vérification des promotions - Jour: ${currentDay}, Heure: ${currentTime}`);
  
  return DAY_BASED_PROMOTIONS.filter(promotion => {
    // Vérifier si le jour actuel est dans les jours applicables
    const isDayApplicable = promotion.applicableDays.includes(currentDay);
    
    // Vérifier l'heure si définie
    let isTimeApplicable = true;
    if (promotion.startTime && promotion.endTime) {
      isTimeApplicable = currentTime >= promotion.startTime && currentTime <= promotion.endTime;
    }
    
    const isActive = isDayApplicable && isTimeApplicable;
    
    if (isActive) {
      console.log(`Promotion active: ${promotion.title}`);
    }
    
    return isActive;
  });
};

export const getActivePromotionForCategory = (category: string): DayBasedPromotion | null => {
  const activePromotions = checkDayBasedPromotions();
  
  return activePromotions.find(promotion => 
    !promotion.applicableCategories || 
    promotion.applicableCategories.includes(category)
  ) || null;
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

// Fonction pour obtenir le nom du jour en français
export const getDayName = (dayIndex: number): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayIndex] || 'Jour inconnu';
};

// Fonction pour vérifier si une promotion est active aujourd'hui
export const isPromotionActiveToday = (promotionId: string): boolean => {
  const activePromotions = checkDayBasedPromotions();
  return activePromotions.some(promo => promo.id === promotionId);
};
