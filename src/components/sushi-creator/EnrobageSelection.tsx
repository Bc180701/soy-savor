import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface EnrobageSelectionProps {
  selectedEnrobages: SushiOption[];
  enrobageOptions: SushiOption[];
  onEnrobageSelect: (option: SushiOption) => void;
}

export const EnrobageSelection = ({ selectedEnrobages, enrobageOptions, onEnrobageSelect }: EnrobageSelectionProps) => {
  console.log("EnrobageSelection render - options:", enrobageOptions);

  if (enrobageOptions.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Choisis l'enrobage (extérieur)</h3>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-gray-600">Aucun enrobage disponible pour le moment.</p>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez ajouter des ingrédients de type "enrobage" dans la section administration.
          </p>
        </div>
      </div>
    );
  }

  const includedOptions = enrobageOptions.filter((opt) => opt.included);
  const premiumOptions = enrobageOptions.filter((opt) => !opt.included);

  const isSelected = (option: SushiOption) => selectedEnrobages.some((e) => e.id === option.id);
  const isMaxReached = selectedEnrobages.length >= 2;

  // Calculer le coût total des enrobages
  const calculateEnrobageCost = () => {
    let cost = 0;
    selectedEnrobages.forEach((enrobage, index) => {
      if (!enrobage.included) {
        // Premium enrobage: toujours +1€
        cost += enrobage.price;
      } else if (index > 0) {
        // Enrobage classique en 2ème position: +1€
        cost += 1;
      }
    });
    return cost;
  };

  const enrobageCost = calculateEnrobageCost();

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis ton enrobage extérieur</h3>
      <p className="text-sm text-gray-600 mb-4">1 enrobage inclus, supplément +1€</p>

      {includedOptions.length > 0 && (
        <>
          <h4 className="font-semibold mb-2">Enrobage classique (inclus) :</h4>
          <div className="space-y-2 mb-4">
            {includedOptions.map((option) => {
              const selected = isSelected(option);
              const disabled = !selected && isMaxReached;

              return (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                    selected ? "border-gold-500 bg-gold-50" : disabled ? "opacity-50" : "hover:border-gray-300"
                  }`}
                >
                  <Checkbox
                    id={`enrobage-${option.id}`}
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={() => onEnrobageSelect(option)}
                  />
                  <Label
                    htmlFor={`enrobage-${option.id}`}
                    className={`flex-1 cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}
                  >
                    <span>{option.name}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </>
      )}

      {premiumOptions.length > 0 && (
        <>
          <h4 className="font-semibold mt-4 mb-2">Enrobage premium (+1€) :</h4>
          <div className="space-y-2">
            {premiumOptions.map((option) => {
              const selected = isSelected(option);
              const disabled = !selected && isMaxReached;

              return (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                    selected ? "border-gold-500 bg-gold-50" : disabled ? "opacity-50" : "hover:border-gray-300"
                  }`}
                >
                  <Checkbox
                    id={`enrobage-${option.id}`}
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={() => onEnrobageSelect(option)}
                  />
                  <Label
                    htmlFor={`enrobage-${option.id}`}
                    className={`flex-1 cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{option.name}</span>
                      <span className="font-semibold text-gold-600">+{option.price}€</span>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </>
      )}

      {enrobageCost > 0 && (
        <div className="mt-4 p-3 bg-gold-50 border border-gold-200 rounded-lg">
          <p className="text-sm text-gold-800">
            Supplément enrobage : <span className="font-semibold">+{enrobageCost.toFixed(2)}€</span>
          </p>
        </div>
      )}
    </div>
  );
};
