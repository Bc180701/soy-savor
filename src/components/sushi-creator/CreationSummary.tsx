
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SushiOption } from "@/types/sushi-creator";

interface CreationSummaryProps {
  selectedEnrobage: SushiOption | null;
  selectedBase: SushiOption | null;
  selectedGarnitures: SushiOption[];
  selectedTopping: SushiOption | null;
  selectedSauce: SushiOption | null;
  totalPrice: number;
}

export const CreationSummary = ({
  selectedEnrobage,
  selectedBase,
  selectedGarnitures,
  selectedTopping,
  selectedSauce,
  totalPrice
}: CreationSummaryProps) => {
  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold mb-4">Récapitulatif de la création actuelle</h3>
      <Card>
        <CardContent className="mt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">Enrobage:</span>
              <span>{selectedEnrobage?.name} {!selectedEnrobage?.included && `(+${selectedEnrobage?.price}€)`}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Base:</span>
              <span>{selectedBase?.name}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="font-semibold">Garnitures:</span>
              <span className="text-right">
                {selectedGarnitures.map(g => g.name).join(', ')}
                {selectedGarnitures.length > 2 && (
                  <span className="block text-sm text-gold-600">
                    (+{selectedGarnitures.length - 2}€ supplément)
                  </span>
                )}
              </span>
            </div>
            {(selectedTopping && !selectedEnrobage?.name.toLowerCase().includes("nori")) && (
              <div className="flex justify-between">
                <span className="font-semibold">Topping:</span>
                <span>{selectedTopping.name}</span>
              </div>
            )}
            {selectedSauce && (
              <div className="flex justify-between">
                <span className="font-semibold">Sauce:</span>
                <span>{selectedSauce.name}</span>
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
