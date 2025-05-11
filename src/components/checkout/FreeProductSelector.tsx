
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ReactNode } from "react";

export interface FreeProduct {
  id: string;
  name: string;
  icon: ReactNode;
}

interface FreeProductSelectorProps {
  products: FreeProduct[];
  selectedProduct: string | null;
  onSelect: (productId: string) => void;
  isPromotionApplicable: boolean;
}

const FreeProductSelector = ({
  products,
  selectedProduct,
  onSelect,
  isPromotionApplicable
}: FreeProductSelectorProps) => {
  if (!isPromotionApplicable) return null;

  return (
    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
      <h4 className="font-semibold text-amber-800">Promotion spéciale</h4>
      <p className="text-sm text-amber-700 mt-1">
        Valable uniquement à emporter les mardis, mercredis et jeudis soirs.
      </p>
      <p className="text-sm font-medium text-amber-700 mt-1">
        Dès 70€ d'achat → Un produit offert au choix :
      </p>
      
      <RadioGroup 
        value={selectedProduct || ""}
        onValueChange={onSelect}
        className="mt-3 space-y-2"
      >
        {products.map((product) => (
          <div key={product.id} className="flex items-center space-x-2">
            <RadioGroupItem value={product.id} id={product.id} />
            <Label htmlFor={product.id} className="flex items-center cursor-pointer">
              {product.icon}
              <span className="ml-2">{product.name}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {isPromotionApplicable && !selectedProduct && (
        <Alert variant="destructive" className="mt-3">
          <AlertTitle>Produit gratuit non sélectionné</AlertTitle>
          <AlertDescription>
            Veuillez sélectionner votre produit gratuit avant de valider votre commande
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FreeProductSelector;
