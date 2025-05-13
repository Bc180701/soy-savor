
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CartItem } from "@/types";
import { OrderSummaryDetails } from "../checkout/OrderSummaryDetails";
import { PaymentMethod } from "../checkout/PaymentMethod";

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
  handleStripeCheckout
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
  
  // Calcul du montant total en tenant compte de la réduction
  const total = subtotal + tax + deliveryFee - discount;

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
      
      <PaymentMethod />
      
      <div className="mt-8 border-t pt-6">
        <div className="flex justify-between text-xl font-bold mb-4">
          <span>Total à payer</span>
          <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total)}</span>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
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
