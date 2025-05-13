
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";
import { CartItemList } from "./CartItemList";
import { PromoCodeSection } from "./PromoCodeSection";
import { OrderSummary } from "./OrderSummary";

interface CartStepProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  appliedPromoCode: {
    code: string;
    discount: number;
    isPercentage: boolean;
  } | null;
  setAppliedPromoCode: React.Dispatch<React.SetStateAction<{
    code: string;
    discount: number;
    isPercentage: boolean;
  } | null>>;
  handleNextStep: () => void;
}

export const CartStep = ({ 
  items, 
  subtotal, 
  tax, 
  discount,
  appliedPromoCode, 
  setAppliedPromoCode,
  handleNextStep 
}: CartStepProps) => {
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Votre Panier</h2>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <CartItemList items={items} />
        
        <PromoCodeSection 
          appliedPromoCode={appliedPromoCode}
          setAppliedPromoCode={setAppliedPromoCode}
        />
        
        <OrderSummary 
          subtotal={subtotal}
          tax={tax}
          deliveryFee={0}
          discount={discount}
          appliedPromoCode={appliedPromoCode}
        />
      </div>
      
      <div className="flex justify-between">
        <Link to="/menu" className="text-gray-500 hover:text-gray-700 flex items-center">
          <X className="mr-2 h-4 w-4" /> Continuer les achats
        </Link>
        <Button 
          onClick={handleNextStep} 
          disabled={items.length === 0} 
          className="bg-gold-500 hover:bg-gold-600 text-black"
        >
          Commander <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
