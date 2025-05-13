
export enum CheckoutStep {
  Cart,
  DeliveryDetails,
  Payment
}

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
}

export const CheckoutSteps = ({ currentStep }: CheckoutStepsProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center mb-4">
        <div className={`flex items-center ${currentStep >= CheckoutStep.Cart ? "text-gold-500" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= CheckoutStep.Cart ? "border-gold-500" : "border-gray-300"}`}>
            1
          </div>
          <span className="ml-2 font-medium">Panier</span>
        </div>
        <div className={`w-12 h-1 mx-2 ${currentStep >= CheckoutStep.DeliveryDetails ? "bg-gold-500" : "bg-gray-300"}`}></div>
        <div className={`flex items-center ${currentStep >= CheckoutStep.DeliveryDetails ? "text-gold-500" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= CheckoutStep.DeliveryDetails ? "border-gold-500" : "border-gray-300"}`}>
            2
          </div>
          <span className="ml-2 font-medium">Livraison</span>
        </div>
        <div className={`w-12 h-1 mx-2 ${currentStep >= CheckoutStep.Payment ? "bg-gold-500" : "bg-gray-300"}`}></div>
        <div className={`flex items-center ${currentStep >= CheckoutStep.Payment ? "text-gold-500" : "text-gray-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= CheckoutStep.Payment ? "border-gold-500" : "border-gray-300"}`}>
            3
          </div>
          <span className="ml-2 font-medium">Paiement</span>
        </div>
      </div>
    </div>
  );
};
