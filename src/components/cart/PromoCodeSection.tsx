
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
  const { toast } = useToast();

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    console.log("🔍 Application code promo avec email:", userEmail);
    
    setPromoCodeLoading(true);
    try {
      const result = await validatePromoCode(promoCode.trim(), userEmail);
      
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
        
        toast({
          title: "Code promo appliqué",
          description: result.message || "Votre code promo a été appliqué avec succès.",
          variant: "default",
        });
        
        // Reset the input field after successful application
        setPromoCode("");
      } else {
        toast({
          title: "Code promo invalide",
          description: result.message || "Ce code promo est invalide ou a expiré.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error applying promo code:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'application du code promo.",
        variant: "destructive",
      });
    } finally {
      setPromoCodeLoading(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromoCode(null);
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
          <div className="flex space-x-2">
            <div className="flex-grow relative">
              <Input
                placeholder="Entrez votre code promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
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
