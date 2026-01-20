
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface ToppingSelectionProps {
  selectedToppings: SushiOption[];
  toppingOptions: SushiOption[];
  selectedEnrobage: SushiOption | null;
  onToppingSelect: (option: SushiOption) => void;
}

export const ToppingSelection = ({ selectedToppings, toppingOptions, selectedEnrobage, onToppingSelect }: ToppingSelectionProps) => {
  const isNoriDisabled = selectedEnrobage?.name.toLowerCase().includes("nori");

  // Calculer le coût des toppings (1 inclus, +0.50€ par ajout)
  const toppingExtraCost = selectedToppings.length > 1 ? (selectedToppings.length - 1) * 0.5 : 0;

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis tes toppings (1 inclus, +0.50€ par ajout)</h3>
      {toppingExtraCost > 0 && (
        <p className="text-sm text-gold-600 mb-4">
          Supplément toppings : +{toppingExtraCost.toFixed(2)}€
        </p>
      )}
      {isNoriDisabled && (
        <p className="text-sm text-red-500 mb-4">
          Toppings non disponibles avec l'enrobage "Maki"
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {toppingOptions.map((option) => {
          const isSelected = selectedToppings.some(t => t.id === option.id);
          return (
            <div key={option.id} className="flex items-center space-x-2 mb-2">
              <Checkbox 
                id={`topping-${option.id}`}
                checked={isSelected}
                onCheckedChange={() => {
                  if (!isNoriDisabled) {
                    onToppingSelect(option);
                  }
                }}
                disabled={isNoriDisabled}
              />
              <Label 
                htmlFor={`topping-${option.id}`}
                className={isNoriDisabled ? "text-gray-400" : "cursor-pointer"}
              >
                {option.name}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
