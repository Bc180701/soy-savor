import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface BaseSelectionProps {
  selectedBases: SushiOption[];
  baseOptions: SushiOption[];
  onBaseSelect: (option: SushiOption) => void;
}

export const BaseSelection = ({ selectedBases, baseOptions, onBaseSelect }: BaseSelectionProps) => {
  console.log("BaseSelection render - options:", baseOptions);

  // Calculer le coût des bases (1 incluse, +1€ pour la 2ème, max 2)
  const baseExtraCost = selectedBases.length > 1 ? 1 : 0;

  if (baseOptions.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Choisis la base (intérieur)</h3>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-gray-600">Aucune base disponible pour le moment.</p>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez ajouter des ingrédients de type "protein" dans la section administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis ta base (1 incluse, 2 max)</h3>
      <p className="text-sm text-gray-500 mb-4">Une base incluse, supplément +1€</p>
      {baseExtraCost > 0 && (
        <p className="text-sm text-gold-600 mb-4">Supplément base : +{baseExtraCost.toFixed(2)}€</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {baseOptions.map((option) => {
          const isSelected = selectedBases.some((b) => b.id === option.id);
          const isDisabled = !isSelected && selectedBases.length >= 2;
          return (
            <div key={option.id} className="flex items-center space-x-2 mb-2">
              <Checkbox
                id={`base-${option.id}`}
                checked={isSelected}
                onCheckedChange={() => {
                  if (!isDisabled || isSelected) {
                    onBaseSelect(option);
                  }
                }}
                disabled={isDisabled}
              />
              <Label htmlFor={`base-${option.id}`} className={isDisabled ? "text-gray-400" : "cursor-pointer"}>
                {option.name}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
