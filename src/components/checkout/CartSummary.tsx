
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { FreeProduct } from "@/components/checkout/FreeProductSelector";

interface CartSummaryProps {
  subtotal: number;
  deliveryFee: number;
  orderType: "delivery" | "pickup";
  isPromotionApplicable: boolean;
  selectedFreeProduct: string | null;
  freeProducts: FreeProduct[];
  isEmpty?: boolean;
  showCheckoutButton?: boolean;
  onCheckout?: () => void;
}

const CartSummary = ({
  subtotal,
  deliveryFee,
  orderType,
  isPromotionApplicable,
  selectedFreeProduct,
  freeProducts,
  isEmpty = false,
  showCheckoutButton = false,
  onCheckout
}: CartSummaryProps) => {
  const calculateTotal = () => {
    const tax = subtotal * 0.1; // 10% TVA
    return subtotal + tax + deliveryFee;
  };

  // Formatage de la date du jour
  const formattedCurrentDay = format(new Date(), "EEEE", { locale: fr });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>TVA (10%)</span>
              <span>{(subtotal * 0.1).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>Frais de livraison</span>
              <span>
                {orderType === "delivery" ? 
                  deliveryFee === 0 ? 
                    "Offerts" : 
                    `${deliveryFee.toFixed(2)} €` : 
                  "—"}
              </span>
            </div>
            
            {/* Afficher si la promotion est applicable */}
            {isPromotionApplicable && (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Promotion</span>
                <span>
                  {selectedFreeProduct ? 
                    `1 ${freeProducts.find(p => p.id === selectedFreeProduct)?.name} offert` : 
                    "Sélectionnez votre produit offert"}
                </span>
              </div>
            )}
            
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{calculateTotal().toFixed(2)} €</span>
            </div>
          </div>
        </CardContent>
        {showCheckoutButton && !isEmpty && (
          <CardFooter>
            <Button 
              className="w-full bg-gold-600 hover:bg-gold-700"
              onClick={onCheckout}
              disabled={isEmpty}
            >
              Passer commande
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Bannière d'information sur la promotion */}
      {orderType === "pickup" && subtotal >= 50 && subtotal < 70 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">
            {formattedCurrentDay === "mardi" || formattedCurrentDay === "mercredi" || formattedCurrentDay === "jeudi" ? (
              <>Plus que <strong>{(70 - subtotal).toFixed(2)}€</strong> pour bénéficier d'un produit offert!</>
            ) : (
              <>Cette commande sera éligible à un produit offert les mardis, mercredis et jeudis si elle atteint 70€</>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default CartSummary;
