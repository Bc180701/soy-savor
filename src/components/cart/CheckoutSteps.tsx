
import { Check } from "lucide-react";

export enum CheckoutStep {
  Cart = 0,
  DeliveryDetails = 1,
  Payment = 2,
}

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
}

export const CheckoutSteps = ({ currentStep }: CheckoutStepsProps) => {
  const steps = [
    { id: CheckoutStep.Cart, name: "Panier" },
    { id: CheckoutStep.DeliveryDetails, name: "Livraison" },
    { id: CheckoutStep.Payment, name: "Paiement" },
  ];

  return (
    <div className="mb-8">
      <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isComplete = currentStep > step.id;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className={`flex items-center ${isActive ? "text-gold-500" : ""} ${isComplete ? "text-green-600" : ""}`}>
              <span className="flex items-center justify-center">
                {isComplete ? (
                  <span className="flex items-center justify-center w-6 h-6 mr-2 text-xs border rounded-full shrink-0 border-green-500 bg-green-500 text-white">
                    <Check className="w-3 h-3" />
                  </span>
                ) : (
                  <span className={`flex items-center justify-center w-6 h-6 mr-2 text-xs border rounded-full shrink-0 ${isActive ? "border-gold-500" : "border-gray-300"}`}>
                    {index + 1}
                  </span>
                )}
                {step.name}
              </span>
              {!isLast && (
                <div className="flex-1 w-full mx-2 sm:mx-4 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
