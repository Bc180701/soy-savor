import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Heart, Check } from "lucide-react";
import { useEventFreeDessertPopup } from "@/hooks/useEventFreeDessertPopup";
import { useCart } from "@/hooks/use-cart";
import { generateProductImageUrl, generateProductImageAlt } from "@/utils/productImageUtils";
import { formatEuro } from "@/utils/formatters";
import { useEffect, useRef } from "react";

export const EventFreeDessertPopup = () => {
  const { 
    showFreeDessertPopup, 
    freeDessertProduct, 
    handleAcceptFreeDessert, 
    closePopup 
  } = useEventFreeDessertPopup();
  
  const { addItem } = useCart();
  const hasAddedRef = useRef(false);

  // Ajouter automatiquement le dessert quand le popup s'ouvre
  useEffect(() => {
    if (showFreeDessertPopup && freeDessertProduct && !hasAddedRef.current) {
      hasAddedRef.current = true;
      addItem(freeDessertProduct, 1, "🎁 Dessert offert - Saint Valentin");
      
      // Fermer automatiquement après 3 secondes
      const timer = setTimeout(() => {
        handleAcceptFreeDessert();
        hasAddedRef.current = false;
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    if (!showFreeDessertPopup) {
      hasAddedRef.current = false;
    }
  }, [showFreeDessertPopup, freeDessertProduct, addItem, handleAcceptFreeDessert]);

  const handleClose = () => {
    handleAcceptFreeDessert();
    hasAddedRef.current = false;
  };

  if (!freeDessertProduct) return null;

  return (
    <Dialog open={showFreeDessertPopup} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-0">
        <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 text-white text-center">
          <div className="mx-auto w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h3 className="text-xl font-bold mb-1">🎁 Cadeau Saint Valentin !</h3>
          <p className="text-white/90 text-sm">Un dessert vous a été offert</p>
        </div>

        <div className="p-4">
          {/* Carte du dessert offert */}
          <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate">
                {freeDessertProduct.name}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold">Gratuit</span>
                {freeDessertProduct.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatEuro(freeDessertProduct.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            
            {freeDessertProduct.imageUrl && (
              <img 
                src={generateProductImageUrl(freeDessertProduct.name, freeDessertProduct.imageUrl)} 
                alt={generateProductImageAlt(freeDessertProduct.name)}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
            )}
          </div>

          <Button 
            onClick={handleClose}
            className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-5 rounded-xl"
          >
            <Gift className="w-5 h-5 mr-2" />
            Super, merci !
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
