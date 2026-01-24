
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SushiOption } from "@/types/sushi-creator";

interface CreationSummaryProps {
  selectedEnrobages: SushiOption[];
  selectedBases: SushiOption[];
  selectedGarnitures: SushiOption[];
  selectedToppings: SushiOption[];
  selectedSauces: SushiOption[];
  totalPrice: number;
}

export const CreationSummary = ({
  selectedEnrobages,
  selectedBases,
  selectedGarnitures,
  selectedToppings,
  selectedSauces,
  totalPrice
}: CreationSummaryProps) => {
  // Calculer les suppléments
  const enrobageExtraCost = selectedEnrobages.length > 1 ? 1 : 0;
  const baseExtraCost = selectedBases.length > 1 ? 1 : 0;
  const garnitureExtraCost = selectedGarnitures.length > 1 ? (selectedGarnitures.length - 1) * 0.5 : 0;
  const toppingExtraCost = selectedToppings.length > 1 ? (selectedToppings.length - 1) * 0.5 : 0;
  const sauceExtraCost = selectedSauces.length > 1 ? (selectedSauces.length - 1) * 0.5 : 0;

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold mb-4">Récapitulatif de la création actuelle</h3>
      <Card>
        <CardContent className="mt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="font-semibold">Enrobage:</span>
              <span className="text-right">
                {selectedEnrobages.map(e => e.name).join(', ')}
                {enrobageExtraCost > 0 && (
                  <span className="block text-sm text-gold-600">
                    (+{enrobageExtraCost.toFixed(2)}€ supplément)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="font-semibold">Base:</span>
              <span className="text-right">
                {selectedBases.map(b => b.name).join(', ')}
                {baseExtraCost > 0 && (
                  <span className="block text-sm text-gold-600">
                    (+{baseExtraCost.toFixed(2)}€ supplément)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="font-semibold">Garnitures:</span>
              <span className="text-right">
                {selectedGarnitures.map(g => g.name).join(', ')}
                {garnitureExtraCost > 0 && (
                  <span className="block text-sm text-gold-600">
                    (+{garnitureExtraCost.toFixed(2)}€ supplément)
                  </span>
                )}
              </span>
            </div>
            {(selectedToppings.length > 0 && !selectedEnrobages.some(e => e.name.toLowerCase().includes("nori"))) && (
              <div className="flex justify-between items-start">
                <span className="font-semibold">Toppings:</span>
                <span className="text-right">
                  {selectedToppings.map(t => t.name).join(', ')}
                  {toppingExtraCost > 0 && (
                    <span className="block text-sm text-gold-600">
                      (+{toppingExtraCost.toFixed(2)}€ supplément)
                    </span>
                  )}
                </span>
              </div>
            )}
            {selectedSauces.length > 0 && (
              <div className="flex justify-between items-start">
                <span className="font-semibold">Sauces:</span>
                <span className="text-right">
                  {selectedSauces.map(s => s.name).join(', ')}
                  {sauceExtraCost > 0 && (
                    <span className="block text-sm text-gold-600">
                      (+{sauceExtraCost.toFixed(2)}€ supplément)
                    </span>
                  )}
                </span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total final:</span>
              <span className="text-gold-600">{totalPrice.toFixed(2)}€</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
