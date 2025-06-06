
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface EnrobageSelectionProps {
  selectedEnrobage: SushiOption | null;
  enrobageOptions: SushiOption[];
  onEnrobageSelect: (option: SushiOption | null) => void;
}

export const EnrobageSelection = ({ selectedEnrobage, enrobageOptions, onEnrobageSelect }: EnrobageSelectionProps) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis ton enrobage extérieur</h3>
      
      <h4 className="font-semibold mb-2">Enrobage classique (inclus) :</h4>
      <RadioGroup value={selectedEnrobage?.id || ""} onValueChange={(value) => {
        const option = enrobageOptions.find(opt => opt.id === value);
        onEnrobageSelect(option || null);
      }}>
        {enrobageOptions.filter(opt => opt.included).map((option) => (
          <div key={option.id} className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value={option.id} id={`enrobage-${option.id}`} />
            <Label htmlFor={`enrobage-${option.id}`}>{option.name}</Label>
          </div>
        ))}
      
        <h4 className="font-semibold mt-4 mb-2">Enrobage premium (+1€) :</h4>
        {enrobageOptions.filter(opt => !opt.included).map((option) => (
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
      </RadioGroup>
    </div>
  );
};
