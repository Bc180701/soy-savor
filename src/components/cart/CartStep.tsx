
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatEuro } from "@/utils/formatters";
import { PromoCodeSection } from "./PromoCodeSection";
import { CartItemList } from "./CartItemList";
import { CartExtrasSection, type CartExtras } from "./CartExtrasSection";
import { useEffect, useState } from "react";
import { MenuItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { generateProductImageUrl, generateProductImageAlt } from "@/utils/productImageUtils";

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
  userEmail?: string;
  cartExtras: CartExtras | null;
  setCartExtras: (extras: CartExtras) => void;
}

export const CartStep = ({
  items,
  subtotal,
  tax,
  discount,
  appliedPromoCode,
  setAppliedPromoCode,
  handleNextStep,
  userEmail,
  cartExtras,
  setCartExtras
}: CartStepProps) => {
  const { 
    removeItem, 
    updateQuantity, 
    plateauCount,
    freeDessertCount,
    getRemainingFreeDesserts,
    addItem
  } = useCart();
  
  const orderTotal = subtotal - discount;
  const isCartEmpty = items.length === 0;
  
  // Vérifier si au moins un produit d'options (0€) a été AJOUTÉ au panier
  const areExtrasValid = items.some((it) => {
    const name = it.menuItem?.name || it.name;
    const category = it.menuItem?.category || it.category;
    return (
      (typeof name === 'string' && (name.startsWith('Sauces:') || name.startsWith('Accompagnements:') || name.startsWith('Baguettes')))
      || (typeof category === 'string' && ['Sauce','Accompagnement','Accessoire'].includes(category as string))
    );
  });
  // Free dessert promotion
  const [showDessertDialog, setShowDessertDialog] = useState(false);
  const [desserts, setDesserts] = useState<MenuItem[]>([]);
  const [loadingDesserts, setLoadingDesserts] = useState(false);
  
  const remainingFreeDesserts = getRemainingFreeDesserts();
  
  // Check if plateaux have been added and offer free desserts
  useEffect(() => {
    const checkForPromotion = async () => {
      if (plateauCount > 0 && remainingFreeDesserts > 0) {
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
              originalPrice: dessert.price // Store original price for reference
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
  }, [plateauCount, remainingFreeDesserts]);
  
  // Handle dessert selection
  const handleSelectDessert = (dessert: MenuItem) => {
    addItem({
      ...dessert,
      price: 0 // Ensure it's free
    }, 1, "Dessert offert - Promotion 1 plateau acheté = 1 dessert offert");
    
    // Si on a encore des desserts gratuits disponibles, garder la boîte ouverte
    // Sinon, la fermer
    if (getRemainingFreeDesserts() <= 1) {
      setShowDessertDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Votre panier</h2>
      
      {/* Affichage du statut de la promotion plateaux/desserts */}
      {plateauCount > 0 && (
        <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gold-800 font-medium">
                🎉 Promotion active : {plateauCount} plateau{plateauCount > 1 ? 'x' : ''} = {plateauCount} dessert{plateauCount > 1 ? 's' : ''} offert{plateauCount > 1 ? 's' : ''} !
              </p>
              <p className="text-sm text-gold-600">
                Desserts gratuits ajoutés : {freeDessertCount}/{plateauCount}
              </p>
            </div>
            {remainingFreeDesserts > 0 && (
              <Button 
                onClick={() => setShowDessertDialog(true)}
                className="bg-gold-500 hover:bg-gold-600 text-black text-sm"
              >
                Choisir {remainingFreeDesserts} dessert{remainingFreeDesserts > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      )}
      
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
          
          {/* Section obligatoire des extras */}
          <CartExtrasSection onExtrasChange={setCartExtras} />
          
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
                disabled={!areExtrasValid}
                className="w-full md:w-1/2 bg-gold-500 hover:bg-gold-600 text-black py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </Button>
              {!areExtrasValid && (
                <p className="text-red-600 text-sm mt-2">
                  Veuillez compléter les options obligatoires ci-dessus
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Free Dessert Dialog */}
      <Dialog open={showDessertDialog} onOpenChange={setShowDessertDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🎁</span>
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gold-600 to-gold-800 bg-clip-text text-transparent">
              Choisissez vos desserts gratuits !
            </DialogTitle>
            <p className="text-lg text-gray-600">
              Vous avez droit à <span className="font-semibold text-gold-600">{remainingFreeDesserts} dessert{remainingFreeDesserts > 1 ? 's' : ''} offert{remainingFreeDesserts > 1 ? 's' : ''}</span> avec vos plateaux
            </p>
          </DialogHeader>
          
          {loadingDesserts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
              <span className="ml-2 text-gray-600">Chargement des desserts...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {desserts.map((dessert) => (
                  <div 
                    key={dessert.id} 
                    className="group relative border-2 border-gray-200 rounded-xl overflow-hidden hover:border-gold-400 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    onClick={() => handleSelectDessert(dessert)}
                  >
                    {/* Badge "Gratuit" */}
                    <div className="absolute top-3 right-3 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      GRATUIT
                    </div>
                    
                    {dessert.imageUrl && (
                      <div className="relative h-40 w-full overflow-hidden">
                        <img 
                          src={generateProductImageUrl(dessert.name, dessert.imageUrl)} 
                          alt={generateProductImageAlt(dessert.name)}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}
                    
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800 group-hover:text-gold-600 transition-colors">
                          {dessert.name}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {dessert.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-green-600">Gratuit</span>
                          {dessert.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatEuro(dessert.originalPrice)}
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-gold-500 hover:bg-gold-600 text-black font-medium px-4 py-2 rounded-lg transition-all duration-200 group-hover:shadow-md"
                        >
                          Choisir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-gold-50 border border-gold-200 rounded-lg">
                <p className="text-center text-sm text-gold-700">
                  <span className="font-semibold">🎉 Offre spéciale :</span> {plateauCount} plateau{plateauCount > 1 ? 'x' : ''} acheté{plateauCount > 1 ? 's' : ''} = {plateauCount} dessert{plateauCount > 1 ? 's' : ''} offert{plateauCount > 1 ? 's' : ''} !
                </p>
                <p className="text-center text-xs text-gold-600 mt-1">
                  Encore {remainingFreeDesserts} dessert{remainingFreeDesserts > 1 ? 's' : ''} à choisir
                </p>
              </div>

              {remainingFreeDesserts === 0 && (
                <div className="text-center">
                  <Button 
                    onClick={() => setShowDessertDialog(false)}
                    className="bg-gold-500 hover:bg-gold-600 text-black"
                  >
                    Terminer
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
