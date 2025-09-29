
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner = ({ message = "Chargement du menu..." }: LoadingSpinnerProps) => {
  return (
    <div className="container mx-auto py-24 px-4 flex justify-center items-center">
      <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
      <span className="ml-2">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
