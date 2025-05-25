
import { usePromotions } from "@/hooks/usePromotions";
import { calculatePromotionDiscount } from "@/services/promotionService";
import { formatEuro } from "@/utils/formatters";
import PromotionBadge from "./PromotionBadge";

interface PriceWithPromotionProps {
  price: number;
  category: string;
  className?: string;
}

export const PriceWithPromotion = ({ 
  price, 
  category, 
  className = "" 
}: PriceWithPromotionProps) => {
  const { getPromotionForCategory } = usePromotions();
  const promotion = getPromotionForCategory(category);

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
