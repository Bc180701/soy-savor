import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface ToppingSelectionProps {
  selectedToppings: SushiOption[];
  toppingOptions: SushiOption[];
  selectedEnrobages: SushiOption[];
  onToppingSelect: (option: SushiOption) => void;
}

export const ToppingSelection = ({
  selectedToppings,
  toppingOptions,
  selectedEnrobages,
  onToppingSelect,
}: ToppingSelectionProps) => {
  const isNoriDisabled = selectedEnrobages.some((e) => e.name.toLowerCase().includes("nori"));

  // Calculer le coût des toppings (1 inclus, +0.50€ par ajout)
  const toppingExtraCost = selectedToppings.length > 1 ? (selectedToppings.length - 1) * 0.5 : 0;
  const maxToppings = 3;
  const isMaxReached = selectedToppings.length >= maxToppings;

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis le topping (extérieur)</h3>
      <p className="text-sm text-gray-500 mb-4">1 inclus, max 3, +0.50€ par ajout</p>
      {toppingExtraCost > 0 && (
        <p className="text-sm text-gold-600 mb-4">Supplément toppings : +{toppingExtraCost.toFixed(2)}€</p>
      )}
      {isNoriDisabled && <p className="text-sm text-red-500 mb-4">Toppings non disponibles avec l'enrobage "Maki"</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {toppingOptions.map((option) => {
          const isSelected = selectedToppings.some((t) => t.id === option.id);
          const isDisabled = isNoriDisabled || (!isSelected && isMaxReached);
          return (
            <div key={option.id} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`topping-${option.id}`}
                checked={isSelected}
                onCheckedChange={() => {
                  if (!isNoriDisabled && (isSelected || !isMaxReached)) {
                    onToppingSelect(option);
                  }
                }}
                disabled={isDisabled}
              />
              <Label htmlFor={`topping-${option.id}`} className={isDisabled ? "text-gray-400" : "cursor-pointer"}>
                {option.name}
              </Label>
            </div>
          );
        })}
      </div>
      {isMaxReached && !isNoriDisabled && <p className="text-sm text-amber-600 mt-2">Maximum de 3 toppings atteint</p>}
    </div>
  );
};
