
import { Badge } from "@/components/ui/badge";
import { DayBasedPromotion } from "@/services/promotionService";

interface PromotionBadgeProps {
  promotion: DayBasedPromotion;
  className?: string;
}

export const PromotionBadge = ({ promotion, className = "" }: PromotionBadgeProps) => {
  return (
    <Badge 
      className={`bg-red-500 hover:bg-red-600 text-white animate-pulse ${className}`}
    >
      -{promotion.discount}{promotion.isPercentage ? '%' : '€'}
    </Badge>
  );
};

export default PromotionBadge;
