
import { formatEuro } from "@/utils/formatters";

interface OrderSummaryProps {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  tip?: number;
  appliedPromoCode: {
    code: string;
    discount: number;
    isPercentage: boolean;
  } | null;
}

export const OrderSummary = ({ 
  subtotal, 
  tax, 
  deliveryFee, 
  discount,
  tip = 0,
  appliedPromoCode 
}: OrderSummaryProps) => {
  return (
    <div className="border-t pt-4">
      <div className="flex justify-between mb-2">
        <span>Sous-total</span>
        <span>{formatEuro(subtotal)}</span>
      </div>
      <div className="flex justify-between mb-2">
        <span>TVA (10%)</span>
        <span>{formatEuro(tax)}</span>
      </div>
      
      {deliveryFee > 0 && (
        <div className="flex justify-between mb-2">
          <span>Frais de livraison</span>
          <span>{formatEuro(deliveryFee)}</span>
        </div>
      )}
      
      {tip > 0 && (
        <div className="flex justify-between mb-2 text-green-700">
          <span>Pourboire</span>
          <span>{formatEuro(tip)}</span>
        </div>
      )}
      
      {appliedPromoCode && (
        <div className="flex justify-between mb-2 text-green-600">
          <span>Réduction</span>
          <span>-{formatEuro(discount)}</span>
        </div>
      )}
      
      <div className="flex justify-between font-bold text-lg mt-4">
        <span>Total</span>
        <span>{formatEuro(subtotal + tax + deliveryFee + (tip || 0) - discount)}</span>
      </div>
    </div>
  );
};
