import { useState } from "react";
import { MenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface WineFormatSelectorProps {
  baseName: string;
  verreProduct: MenuItem;
  bouteilleProduct: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export const WineFormatSelector = ({ 
  baseName, 
  verreProduct, 
  bouteilleProduct, 
  onAddToCart 
}: WineFormatSelectorProps) => {
  const [selectedFormat, setSelectedFormat] = useState<"verre" | "bouteille">("verre");

  const handleAddToCart = () => {
    const selectedProduct = selectedFormat === "verre" ? verreProduct : bouteilleProduct;
    onAddToCart(selectedProduct);
  };

  return (
    <div className="space-y-3">
      <RadioGroup 
        value={selectedFormat} 
        onValueChange={(value) => setSelectedFormat(value as "verre" | "bouteille")}
        className="grid grid-cols-2 gap-2"
      >
        <div>
          <RadioGroupItem 
            value="verre" 
            id={`verre-${verreProduct.id}`} 
            className="peer sr-only"
          />
          <Label
            htmlFor={`verre-${verreProduct.id}`}
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-gold-500 [&:has([data-state=checked])]:border-gold-500 cursor-pointer transition-all"
          >
            <span className="text-sm font-medium">🍷 Verre</span>
            <span className="text-lg font-bold mt-1">{verreProduct.price.toFixed(2)}€</span>
          </Label>
        </div>
        
        <div>
          <RadioGroupItem 
            value="bouteille" 
            id={`bouteille-${bouteilleProduct.id}`} 
            className="peer sr-only"
          />
          <Label
            htmlFor={`bouteille-${bouteilleProduct.id}`}
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-gold-500 [&:has([data-state=checked])]:border-gold-500 cursor-pointer transition-all"
          >
            <span className="text-sm font-medium">🍾 Bouteille</span>
            <span className="text-lg font-bold mt-1">{bouteilleProduct.price.toFixed(2)}€</span>
          </Label>
        </div>
      </RadioGroup>

      <Button
        onClick={handleAddToCart}
        className="w-full bg-gold-500 hover:bg-gold-600 text-black"
      >
        Ajouter au panier
      </Button>
    </div>
  );
};
