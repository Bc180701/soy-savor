
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

  const isSelected = (option: SushiOption) => selectedEnrobages.some(e => e.id === option.id);
  const isMaxReached = selectedEnrobages.length >= 2;

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis ton enrobage extérieur</h3>
      <p className="text-sm text-gray-600 mb-4">
        1 enrobage inclus, +1€ pour le 2ème (max 2)
      </p>
      
      <div className="space-y-3">
        {enrobageOptions.map((option) => {
          const selected = isSelected(option);
          const disabled = !selected && isMaxReached;
          
          return (
            <div 
              key={option.id} 
              className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                selected ? 'border-gold-500 bg-gold-50' : disabled ? 'opacity-50' : 'hover:border-gray-300'
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
                className={`flex-1 cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span>{option.name}</span>
                  {selectedEnrobages.length > 0 && !selected && (
                    <span className="text-sm text-gold-600 font-semibold">+1€</span>
                  )}
                </div>
              </Label>
            </div>
          );
        })}
      </div>

      {selectedEnrobages.length > 1 && (
        <div className="mt-4 p-3 bg-gold-50 border border-gold-200 rounded-lg">
          <p className="text-sm text-gold-800">
            Supplément enrobage : <span className="font-semibold">+1€</span>
          </p>
        </div>
      )}
    </div>
  );
};
