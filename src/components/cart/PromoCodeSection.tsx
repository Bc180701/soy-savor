
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TicketPercent, X, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { validatePromoCode, recordPromoCodeUsage } from "@/services/deliveryService";
import { formatEuro } from "@/utils/formatters";

interface PromoCodeSectionProps {
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
  userEmail?: string;
}

export const PromoCodeSection = ({ appliedPromoCode, setAppliedPromoCode, userEmail }: PromoCodeSectionProps) => {
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoCodeLoading, setPromoCodeLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { toast } = useToast();

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    console.log("🔍 Application code promo avec email:", userEmail);
    
    setPromoCodeLoading(true);
    setErrorMessage(""); // Clear previous errors
    
    try {
      const result = await validatePromoCode(promoCode.trim(), userEmail);
      
      console.log("📋 Résultat validation:", result);
      
      if (result.valid && result.discount !== undefined) {
        // If validation is successful, record the usage if we have a user email
        if (userEmail) {
          await recordPromoCodeUsage(promoCode.trim(), userEmail);
        }
        
        setAppliedPromoCode({
          code: promoCode.toUpperCase(),
          discount: result.discount,
          isPercentage: result.isPercentage || false
        });
        
        setErrorMessage(""); // Clear any errors
        toast({
          title: "✅ Code promo appliqué",
          description: result.message || "Votre code promo a été appliqué avec succès.",
          duration: 5000,
        });
        
        // Reset the input field after successful application
        setPromoCode("");
      } else {
        // Code invalide ou déjà utilisé
        const errorMsg = result.message || "Ce code promo est invalide ou a expiré.";
        setErrorMessage(errorMsg);
        setPromoCode(""); // Clear le champ même en cas d'erreur
        toast({
          title: "❌ Code promo refusé",
          description: errorMsg,
          variant: "destructive",
          duration: 6000,
        });
      }
    } catch (error) {
      console.error("Error applying promo code:", error);
      const errorMsg = "Une erreur est survenue lors de l'application du code promo.";
      setErrorMessage(errorMsg);
      setPromoCode("");
      toast({
        title: "❌ Erreur",
        description: errorMsg,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
    setErrorMessage(""); // Clear any errors when removing
    toast({
      title: "Code promo retiré",
      description: "Le code promo a été retiré de votre panier.",
      variant: "default",
    });
  };

  return (
    <div className="border-t pt-4 mb-4">
      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-medium">Code promo</h3>
        
        {appliedPromoCode ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="font-medium">{appliedPromoCode.code}</p>
                <p className="text-sm text-gray-600">
                  {appliedPromoCode.isPercentage
                    ? `Réduction de ${appliedPromoCode.discount}%`
                    : `Réduction de ${formatEuro(appliedPromoCode.discount)}`}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={removePromoCode}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <div className="flex-grow relative">
                <Input
                  placeholder="Entrez votre code promo"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setErrorMessage(""); // Clear error when typing
                  }}
                  className="pr-10"
                />
                <TicketPercent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              <Button 
                onClick={handleApplyPromoCode} 
                disabled={promoCodeLoading || !promoCode.trim()} 
                className="bg-gold-500 hover:bg-gold-600 text-black"
              >
                {promoCodeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Appliquer"
                )}
              </Button>
            </div>
            {errorMessage && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
                {errorMessage}
              </div>
            )}
          </div>
        )}
        {!userEmail && !appliedPromoCode && (
          <p className="text-sm text-amber-600">
            Connectez-vous pour utiliser des codes promo personnalisés
          </p>
        )}
      </div>
    </div>
  );
};
