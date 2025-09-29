
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface BaseSelectionProps {
  selectedBase: SushiOption | null;
  baseOptions: SushiOption[];
  onBaseSelect: (option: SushiOption | null) => void;
}

export const BaseSelection = ({ selectedBase, baseOptions, onBaseSelect }: BaseSelectionProps) => {
  console.log("BaseSelection render - options:", baseOptions);
  
  if (baseOptions.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Choisis ta base (1 choix inclus)</h3>
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
      <h3 className="text-xl font-bold mb-4">Choisis ta base (1 choix inclus)</h3>
      <RadioGroup value={selectedBase?.id || ""} onValueChange={(value) => {
        const option = baseOptions.find(opt => opt.id === value);
        onBaseSelect(option || null);
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {baseOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={option.id} id={`base-${option.id}`} />
              <Label htmlFor={`base-${option.id}`}>{option.name}</Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};
