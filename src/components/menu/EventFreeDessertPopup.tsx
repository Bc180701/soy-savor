import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Heart, X } from "lucide-react";
import { useEventFreeDessertPopup } from "@/hooks/useEventFreeDessertPopup";
import { useCart } from "@/hooks/use-cart";
import { generateProductImageUrl, generateProductImageAlt } from "@/utils/productImageUtils";
import { formatEuro } from "@/utils/formatters";
import { useToast } from "@/hooks/use-toast";

export const EventFreeDessertPopup = () => {
  const { 
    showFreeDessertPopup, 
    freeDessertProduct, 
    handleAcceptFreeDessert, 
    handleDeclineFreeDessert,
    closePopup 
  } = useEventFreeDessertPopup();
  
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAccept = () => {
    const dessert = handleAcceptFreeDessert();
    if (dessert) {
      addItem(dessert, 1, "🎁 Dessert offert - Saint Valentin");
      toast({
        title: "🎁 Dessert offert ajouté !",
        description: `${dessert.name} a été ajouté gratuitement à votre panier`,
      });
    }
  };

  const handleDecline = () => {
    handleDeclineFreeDessert();
    toast({
      title: "Pas de problème !",
      description: "Vous pouvez continuer vos achats",
    });
  };

  if (!freeDessertProduct) return null;

  return (
    <Dialog open={showFreeDessertPopup} onOpenChange={(open) => !open && closePopup()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
            🎁 Offre Saint Valentin !
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Profitez d'un dessert offert avec votre commande !
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Carte du dessert offert */}
          <div className="relative border-2 border-pink-200 rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-red-50">
            {/* Badge GRATUIT */}
            <div className="absolute top-3 right-3 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              GRATUIT
            </div>
            
            {freeDessertProduct.imageUrl && (
              <div className="relative h-48 w-full overflow-hidden">
                <img 
                  src={generateProductImageUrl(freeDessertProduct.name, freeDessertProduct.imageUrl)} 
                  alt={generateProductImageAlt(freeDessertProduct.name)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            )}
            
            <div className="p-4 space-y-2">
              <h4 className="font-bold text-lg text-gray-800">
                {freeDessertProduct.name}
              </h4>
              {freeDessertProduct.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {freeDessertProduct.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">Gratuit</span>
                {freeDessertProduct.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatEuro(freeDessertProduct.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleAccept}
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-6 text-lg rounded-xl shadow-lg"
            >
              <Gift className="w-5 h-5 mr-2" />
              Oui, je veux mon dessert offert !
            </Button>
            
            <Button 
              variant="ghost"
              onClick={handleDecline}
              className="w-full text-gray-500 hover:text-gray-700 py-4"
            >
              Non merci, continuer sans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
