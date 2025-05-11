
import { CreditCard } from "lucide-react";

interface PaymentMethodDisplayProps {
  className?: string;
}

const PaymentMethodDisplay = ({ className }: PaymentMethodDisplayProps) => {
  return (
    <div className={`mt-2 flex items-center bg-gray-50 p-3 rounded-md border ${className}`}>
      <CreditCard className="mr-2 text-gold-600" />
      <p>Carte bancaire</p>
      <div className="ml-auto flex space-x-2">
        <img src="/visa.svg" alt="Visa" className="h-6" />
        <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
        <img src="/amex.svg" alt="American Express" className="h-6" />
        <img src="/cb.svg" alt="Carte Bancaire" className="h-6" />
      </div>
    </div>
  );
};

export default PaymentMethodDisplay;
