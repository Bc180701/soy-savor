import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface EnrobageSelectionProps {
  selectedEnrobages: SushiOption[];
  enrobageOptions: SushiOption[];
  onEnrobageSelect: (option: SushiOption) => void;
  onClassicSelect: (option: SushiOption) => void;
}

export const EnrobageSelection = ({ selectedEnrobages, enrobageOptions, onEnrobageSelect, onClassicSelect }: EnrobageSelectionProps) => {
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

  const classicOptions = enrobageOptions.filter((opt) => opt.included);
  const premiumOptions = enrobageOptions.filter((opt) => !opt.included);

  const isSelected = (option: SushiOption) => selectedEnrobages.some((e) => e.id === option.id);
  
  // Compter les enrobages premium sélectionnés
  const selectedPremiumCount = selectedEnrobages.filter((e) => !e.included).length;
  
  // Logique: max 1 premium en plus
  const isPremiumMaxReached = selectedPremiumCount >= 1;
  
  // On ne peut sélectionner qu'un seul classique (radio)
  const selectedClassicId = selectedEnrobages.find((e) => e.included)?.id || "";

  // Calculer le coût total des enrobages (seuls les premium coûtent +1€)
  const calculateEnrobageCost = () => {
    return selectedEnrobages.filter((e) => !e.included).reduce((sum, e) => sum + e.price, 0);
  };

  const enrobageCost = calculateEnrobageCost();

  // Handler pour la sélection classique (radio - appelle directement le parent)
  const handleClassicSelect = (optionId: string) => {
    const option = classicOptions.find((o) => o.id === optionId);
    if (option) {
      onClassicSelect(option);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis l'enrobage (extérieur)</h3>
      <p className="text-sm text-gray-500 mb-4">1 enrobage inclus, supplément premium +1€</p>

      {classicOptions.length > 0 && (
        <>
          <h4 className="font-semibold mb-2">Enrobage classique (inclus) :</h4>
          <div className="border rounded-lg mb-4 overflow-hidden">
            <RadioGroup value={selectedClassicId} onValueChange={handleClassicSelect}>
              {classicOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-3 p-3 transition-colors ${
                    isSelected(option) ? "bg-gold-50" : "hover:bg-gray-50"
                  } ${index < classicOptions.length - 1 ? "border-b" : ""}`}
                >
                  <RadioGroupItem value={option.id} id={`enrobage-${option.id}`} />
                  <Label htmlFor={`enrobage-${option.id}`} className="flex-1 cursor-pointer">
                    <span>{option.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </>
      )}

      {premiumOptions.length > 0 && (
        <>
          <h4 className="font-semibold mt-4 mb-2">Enrobage premium (+1€) :</h4>
          <p className="text-xs text-gray-500 mb-2">Maximum 1 enrobage premium en supplément</p>
          <div className="space-y-2">
            {premiumOptions.map((option) => {
              const selected = isSelected(option);
              const disabled = !selected && isPremiumMaxReached;

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
