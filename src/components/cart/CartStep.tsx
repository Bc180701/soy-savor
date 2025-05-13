
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatEuro } from "@/utils/formatters";
import { PromoCodeSection } from "./PromoCodeSection";
import { CartItemList } from "./CartItemList";

interface CartStepProps {
  items: any[];
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
  userEmail?: string; // Optional user email
}

export const CartStep = ({
  items,
  subtotal,
  tax,
  discount,
  appliedPromoCode,
  setAppliedPromoCode,
  handleNextStep,
  userEmail
}: CartStepProps) => {
  const { removeItem, updateQuantity } = useCart();
  const orderTotal = subtotal + tax - discount;
  const isCartEmpty = items.length === 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Votre panier</h2>
      
      {isCartEmpty ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">Votre panier est vide</h3>
          <p className="text-gray-500 mb-6">Ajoutez des articles depuis notre menu.</p>
          <Button 
            onClick={() => window.location.href = '/commander'}
            className="bg-akane-600 hover:bg-akane-700"
          >
            Voir le menu
          </Button>
        </div>
      ) : (
        <>
          <CartItemList 
            items={items} 
            removeItem={removeItem} 
            updateQuantity={updateQuantity}
          />
          
          <div className="border-t pt-4">
            <PromoCodeSection 
              appliedPromoCode={appliedPromoCode} 
              setAppliedPromoCode={setAppliedPromoCode}
              userEmail={userEmail} 
            />
            
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span className="font-medium">{formatEuro(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA (10%)</span>
                <span>{formatEuro(tax)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction</span>
                  <span>-{formatEuro(discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span>{formatEuro(orderTotal)}</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                onClick={handleNextStep}
                className="w-full md:w-1/2 bg-akane-600 hover:bg-akane-700 text-white py-3"
              >
                Continuer
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
