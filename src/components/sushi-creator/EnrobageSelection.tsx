
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface EnrobageSelectionProps {
  selectedEnrobage: SushiOption | null;
  enrobageOptions: SushiOption[];
  onEnrobageSelect: (option: SushiOption | null) => void;
}

export const EnrobageSelection = ({ selectedEnrobage, enrobageOptions, onEnrobageSelect }: EnrobageSelectionProps) => {
  console.log("EnrobageSelection render - options:", enrobageOptions);
  
  if (enrobageOptions.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Choisis ton enrobage extérieur</h3>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-gray-600">Aucun enrobage disponible pour le moment.</p>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez ajouter des ingrédients de type "enrobage" dans la section administration.
          </p>
        </div>
      </div>
    );
  }

  const includedOptions = enrobageOptions.filter(opt => opt.included);
  const premiumOptions = enrobageOptions.filter(opt => !opt.included);

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis ton enrobage extérieur</h3>
      
      <RadioGroup value={selectedEnrobage?.id || ""} onValueChange={(value) => {
        const option = enrobageOptions.find(opt => opt.id === value);
        onEnrobageSelect(option || null);
      }}>
        {includedOptions.length > 0 && (
          <>
            <h4 className="font-semibold mb-2">Enrobage classique (inclus) :</h4>
            {includedOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={option.id} id={`enrobage-${option.id}`} />
                <Label htmlFor={`enrobage-${option.id}`}>{option.name}</Label>
              </div>
            ))}
          </>
        )}
      
        {premiumOptions.length > 0 && (
          <>
            <h4 className="font-semibold mt-4 mb-2">Enrobage premium (+1€) :</h4>
            {premiumOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={option.id} id={`enrobage-${option.id}`} />
                <Label htmlFor={`enrobage-${option.id}`}>
                  <div className="flex justify-between">
                    <span>{option.name}</span>
                    <span className="font-semibold">+{option.price}€</span>
                  </div>
                </Label>
              </div>
            ))}
          </>
        )}
      </RadioGroup>
    </div>
  );
};
