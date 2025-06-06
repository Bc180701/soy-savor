
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface ToppingSelectionProps {
  selectedTopping: SushiOption | null;
  toppingOptions: SushiOption[];
  selectedEnrobage: SushiOption | null;
  onToppingSelect: (option: SushiOption | null) => void;
}

export const ToppingSelection = ({ selectedTopping, toppingOptions, selectedEnrobage, onToppingSelect }: ToppingSelectionProps) => {
  const isNoriDisabled = selectedEnrobage?.name.toLowerCase().includes("nori");

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis ton topping (1 choix inclus)</h3>
      {isNoriDisabled && (
        <p className="text-sm text-red-500 mb-4">
          Toppings non disponibles avec l'enrobage "Maki"
        </p>
      )}
      <RadioGroup 
        value={selectedTopping?.id || ""}
        onValueChange={(value) => {
          if (!isNoriDisabled) {
            const option = toppingOptions.find(opt => opt.id === value);
            onToppingSelect(option || null);
          }
        }}
        disabled={isNoriDisabled}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {toppingOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem 
                value={option.id} 
                id={`topping-${option.id}`} 
                disabled={isNoriDisabled}
              />
              <Label 
                htmlFor={`topping-${option.id}`}
                className={isNoriDisabled ? "text-gray-400" : ""}
              >
                {option.name}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};
