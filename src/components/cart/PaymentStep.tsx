
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CartItem } from "@/types";
import { OrderSummaryDetails } from "../checkout/OrderSummaryDetails";
import { PaymentMethod } from "../checkout/PaymentMethod";
import { TipSelector } from "./TipSelector";

interface PaymentStepProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  appliedPromoCode: {
    code: string;
    discount: number;
    isPercentage: boolean;
  } | null;
  deliveryInfo: {
    orderType: "delivery" | "pickup";
    name: string;
    email: string;
    phone: string;
    street?: string;
    city?: string;
    postalCode?: string;
    pickupTime?: string;
    notes?: string;
    allergies: string[];
  };
  loading: boolean;
  handlePreviousStep: () => void;
  handleStripeCheckout: () => Promise<void>;
  tip: number;
  setTip: (amount: number) => void;
}

export const PaymentStep = ({
  items,
  subtotal,
  tax,
  deliveryFee,
  discount,
  appliedPromoCode,
  deliveryInfo,
  loading,
  handlePreviousStep,
  handleStripeCheckout,
  tip,
  setTip
}: PaymentStepProps) => {
  const allergyOptions = [
    { id: "gluten", name: "Gluten" },
    { id: "crustaces", name: "Crustacés" },
    { id: "eggs", name: "Œufs" },
    { id: "fish", name: "Poisson" },
    { id: "peanuts", name: "Arachides" },
    { id: "soy", name: "Soja" },
    { id: "nuts", name: "Fruits à coque" },
    { id: "sesame", name: "Sésame" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Récapitulatif de commande</h2>
      
      <OrderSummaryDetails
        items={items}
        subtotal={subtotal}
        tax={tax}
        deliveryFee={deliveryFee}
        discount={discount}
        appliedPromoCode={appliedPromoCode}
        deliveryInfo={deliveryInfo}
        allergyOptions={allergyOptions}
      />
      
      <div className="my-6">
        <TipSelector 
          subtotal={subtotal} 
          onTipChange={setTip} 
          currentTip={tip}
        />
      </div>
      
      <PaymentMethod />
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={handlePreviousStep}
          className="text-gray-500 hover:text-gray-700"
        >
          Modifier les informations
        </Button>
        <Button
          onClick={handleStripeCheckout}
          disabled={loading}
          className="bg-gold-500 hover:bg-gold-600 text-black"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement en cours...
            </>
          ) : (
            <>Procéder au paiement</>
          )}
        </Button>
      </div>
    </div>
  );
};
