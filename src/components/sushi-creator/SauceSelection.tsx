import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface SauceSelectionProps {
  selectedSauces: SushiOption[];
  sauceOptions: SushiOption[];
  onSauceSelect: (option: SushiOption) => void;
}

export const SauceSelection = ({ selectedSauces, sauceOptions, onSauceSelect }: SauceSelectionProps) => {
  // Calculer le coût des sauces (1 incluse, +0.50€ par ajout)
  const sauceExtraCost = selectedSauces.length > 1 ? (selectedSauces.length - 1) * 0.5 : 0;
  const maxSauces = 3;
  const isMaxReached = selectedSauces.length >= maxSauces;

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis la sauce (extérieur)</h3>
      <p className="text-sm text-gray-500 mb-4">Une sauce incluse, supplément 0.50€</p>
      {sauceExtraCost > 0 && (
        <p className="text-sm text-gold-600 mb-4">Supplément sauces : +{sauceExtraCost.toFixed(2)}€</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {sauceOptions.map((option) => {
          const isSelected = selectedSauces.some((s) => s.id === option.id);
          return (
            <div key={option.id} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`sauce-${option.id}`}
                checked={isSelected}
                onCheckedChange={() => onSauceSelect(option)}
                disabled={!isSelected && isMaxReached}
              />
              <Label
                htmlFor={`sauce-${option.id}`}
                className={!isSelected && isMaxReached ? "text-gray-400" : "cursor-pointer"}
              >
                {option.name}
              </Label>
            </div>
          );
        })}
      </div>
      {isMaxReached && <p className="text-sm text-amber-600 mt-2">Maximum de 3 sauces atteint</p>}
    </div>
  );
};
