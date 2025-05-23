
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatEuro } from "@/utils/formatters";
import { PromoCodeSection } from "./PromoCodeSection";
import { CartItemList } from "./CartItemList";
import { useEffect, useState } from "react";
import { MenuItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CartStepProps {
  items: any[];
  subtotal: number;
  tax: number;
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
  handleNextStep: () => void;
  userEmail?: string; // Optional user email
}

export const CartStep = ({
  items,
  subtotal,
  tax,
  discount,
  appliedPromoCode,
  setAppliedPromoCode,
  handleNextStep,
  userEmail
}: CartStepProps) => {
  const { 
    removeItem, 
    updateQuantity, 
    hasPlateauInCart, 
    hasAddedFreeDessert,
    setHasAddedFreeDessert,
    addItem
  } = useCart();
  
  const orderTotal = subtotal + tax - discount;
  const isCartEmpty = items.length === 0;
  
  // Free dessert promotion
  const [showDessertDialog, setShowDessertDialog] = useState(false);
  const [desserts, setDesserts] = useState<MenuItem[]>([]);
  const [loadingDesserts, setLoadingDesserts] = useState(false);
  
  // Check if a plateau has been added and offer a free dessert
  useEffect(() => {
    const checkForPromotion = async () => {
      if (hasPlateauInCart && !hasAddedFreeDessert) {
        setLoadingDesserts(true);
        try {
          // Fetch desserts from Supabase
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', 'desserts');
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            // Format the desserts
            const formattedDesserts: MenuItem[] = data.map(dessert => ({
              id: dessert.id,
              name: dessert.name,
              description: dessert.description || '',
              price: 0, // Free dessert
              imageUrl: dessert.image_url,
              category: 'desserts',
              originalPrice: dessert.price // Keep original price for reference
            }));
            
            setDesserts(formattedDesserts);
            setShowDessertDialog(true);
          }
        } catch (error) {
          console.error("Error fetching desserts:", error);
        } finally {
          setLoadingDesserts(false);
        }
      }
    };
    
    checkForPromotion();
  }, [hasPlateauInCart, hasAddedFreeDessert]);
  
  // Handle dessert selection
  const handleSelectDessert = (dessert: MenuItem) => {
    addItem({
      ...dessert,
      price: 0 // Ensure it's free
    }, 1, "Dessert offert - Promotion 1 plateau acheté = 1 dessert offert");
    
    setHasAddedFreeDessert(true);
    setShowDessertDialog(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Votre panier</h2>
      
      {isCartEmpty ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">Votre panier est vide</h3>
          <p className="text-gray-500 mb-6">Ajoutez des articles depuis notre menu.</p>
          <Button 
            onClick={() => window.location.href = '/commander'}
            className="bg-gold-500 hover:bg-gold-600 text-black"
          >
            Voir le menu
          </Button>
        </div>
      ) : (
        <>
          <CartItemList 
            items={items} 
            removeItem={removeItem} 
            updateQuantity={updateQuantity}
          />
          
          <div className="border-t pt-4">
            <PromoCodeSection 
              appliedPromoCode={appliedPromoCode} 
              setAppliedPromoCode={setAppliedPromoCode}
              userEmail={userEmail} 
            />
            
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span className="font-medium">{formatEuro(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>TVA (10%)</span>
                <span>{formatEuro(tax)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction</span>
                  <span>-{formatEuro(discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span>{formatEuro(orderTotal)}</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                onClick={handleNextStep}
                className="w-full md:w-1/2 bg-gold-500 hover:bg-gold-600 text-black py-3"
              >
                Continuer
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Free Dessert Dialog */}
      <Dialog open={showDessertDialog} onOpenChange={setShowDessertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisissez votre dessert offert</DialogTitle>
          </DialogHeader>
          
          {loadingDesserts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {desserts.map((dessert) => (
                <div 
                  key={dessert.id} 
                  className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectDessert(dessert)}
                >
                  {dessert.imageUrl && (
                    <div className="relative h-24 mb-2">
                      <img 
                        src={dessert.imageUrl} 
                        alt={dessert.name} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  )}
                  <h4 className="font-medium">{dessert.name}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{dessert.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-green-600 font-medium">Gratuit</span>
                    <Button size="sm" className="bg-gold-500 hover:bg-gold-600 text-black">
                      Sélectionner
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
