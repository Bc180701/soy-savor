
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface CheckoutNavigationProps {
  currentStep: string;
  onNext: () => void;
  onPrevious: () => void;
  isNextDisabled?: boolean;
  isProcessing?: boolean;
  isRedirectingToPayment?: boolean;
  isPaymentStep?: boolean;
  onCheckout?: () => void;
  isPromotionApplicable?: boolean;
  hasSelectedFreeProduct?: boolean;
}

const CheckoutNavigation = ({
  currentStep,
  onNext,
  onPrevious,
  isNextDisabled = false,
  isProcessing = false,
  isRedirectingToPayment = false,
  isPaymentStep = false,
  onCheckout,
  isPromotionApplicable = false,
  hasSelectedFreeProduct = false
}: CheckoutNavigationProps) => {
  return (
    <div className="flex justify-between mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        className="flex items-center gap-2"
        disabled={isProcessing || isRedirectingToPayment}
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
      
      {isPaymentStep ? (
        <Button 
          className="bg-gold-600 hover:bg-gold-700"
          onClick={onCheckout}
          disabled={isProcessing || (isPromotionApplicable && !hasSelectedFreeProduct) || isRedirectingToPayment}
        >
          {isProcessing ? 
            "Traitement en cours..." : 
            isRedirectingToPayment ? 
            "Préparation du paiement..." : 
            "Continuer au paiement"}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          className="bg-gold-600 hover:bg-gold-700"
        >
          Continuer <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
};

export default CheckoutNavigation;
