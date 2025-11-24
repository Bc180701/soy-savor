
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CartItem } from "@/types";
import { OrderSummaryDetails } from "../checkout/OrderSummaryDetails";
import { PaymentMethod } from "../checkout/PaymentMethod";
import { TipSelector } from "./TipSelector";
import { PromoCodeSection } from "./PromoCodeSection";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

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
  setAppliedPromoCode: React.Dispatch<React.SetStateAction<{
    code: string;
    discount: number;
    isPercentage: boolean;
  } | null>>;
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
  setAppliedPromoCode,
  deliveryInfo,
  loading,
  handlePreviousStep,
  handleStripeCheckout,
  tip,
  setTip
}: PaymentStepProps) => {
  const { toast } = useToast();
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

  const [isTipDialogOpen, setIsTipDialogOpen] = useState(false);

  const handlePayButtonClick = async () => {
    try {
      await handleStripeCheckout();
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Récapitulatif de commande</h2>
      
      <PromoCodeSection 
        appliedPromoCode={appliedPromoCode} 
        setAppliedPromoCode={setAppliedPromoCode}
        userEmail={deliveryInfo.email}
      />
      
      <OrderSummaryDetails
        items={items}
        subtotal={subtotal}
        tax={tax}
        deliveryFee={deliveryFee}
        discount={discount}
        tip={tip}
        appliedPromoCode={appliedPromoCode}
        deliveryInfo={deliveryInfo}
        allergyOptions={allergyOptions}
      />
      
      <div className="my-6">
        <Button 
          variant="outline" 
          className="w-full mb-4 flex justify-between items-center"
          onClick={() => setIsTipDialogOpen(true)}
        >
          <span>Ajouter un pourboire</span>
          <span className="text-green-600 font-medium">
            {tip > 0 ? `${(tip).toFixed(2)}€` : "Optionnel"}
          </span>
        </Button>
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
          onClick={handlePayButtonClick}
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

      {/* Tip Selector Dialog */}
      <TipSelector
        subtotal={subtotal}
        onTipChange={setTip}
        currentTip={tip}
        isOpen={isTipDialogOpen}
        onOpenChange={setIsTipDialogOpen}
        onContinue={handleStripeCheckout}
      />
    </div>
  );
};
