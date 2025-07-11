
import { useEffect, useState } from "react";
import { getActivePromotionForProduct, calculatePromotionDiscount, DayBasedPromotion } from "@/services/promotionService";
import { formatEuro } from "@/utils/formatters";
import PromotionBadge from "./PromotionBadge";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

interface PriceWithPromotionProps {
  price: number;
  category: string;
  productId?: string;
  className?: string;
}

export const PriceWithPromotion = ({ 
  price, 
  category, 
  productId,
  className = "" 
}: PriceWithPromotionProps) => {
  const [promotion, setPromotion] = useState<DayBasedPromotion | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentRestaurant } = useRestaurantContext();

  useEffect(() => {
    const checkPromotion = async () => {
      try {
        console.log(`Vérification promotion pour produit ${productId}, catégorie ${category}, restaurant ${currentRestaurant?.id}`);
        
        let activePromotion = null;
        if (productId) {
          // Vérifier d'abord si il y a une promotion pour le produit spécifique
          activePromotion = await getActivePromotionForProduct(productId, category, currentRestaurant?.id);
        }
        
        // Si pas de promotion spécifique au produit, vérifier par catégorie
        if (!activePromotion) {
          const { getActivePromotionForCategory } = await import("@/services/promotionService");
          activePromotion = await getActivePromotionForCategory(category, currentRestaurant?.id);
        }
        
        console.log(`Promotion trouvée:`, activePromotion);
        setPromotion(activePromotion);
      } catch (error) {
        console.error('Erreur lors de la vérification de la promotion:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPromotion();
  }, [category, productId, currentRestaurant?.id]);

  if (loading) {
    return (
      <span className={`text-lg font-semibold ${className}`}>
        {formatEuro(price)}
      </span>
    );
  }

  if (!promotion) {
    return (
      <span className={`text-lg font-semibold ${className}`}>
        {formatEuro(price)}
      </span>
    );
  }

  const { discountedPrice, discountAmount } = calculatePromotionDiscount(price, promotion);

  return (
    <div className={`flex flex-col items-end ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 line-through">
          {formatEuro(price)}
        </span>
        <PromotionBadge promotion={promotion} />
      </div>
      <span className="text-lg font-bold text-red-600">
        {formatEuro(discountedPrice)}
      </span>
      <span className="text-xs text-green-600">
        Économie: {formatEuro(discountAmount)}
      </span>
    </div>
  );
};

export default PriceWithPromotion;
