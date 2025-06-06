
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface SauceSelectionProps {
  selectedSauce: SushiOption | null;
  sauceOptions: SushiOption[];
  onSauceSelect: (option: SushiOption | null) => void;
}

export const SauceSelection = ({ selectedSauce, sauceOptions, onSauceSelect }: SauceSelectionProps) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis ta sauce (1 choix inclus)</h3>
      <RadioGroup value={selectedSauce?.id || ""} onValueChange={(value) => {
        const option = sauceOptions.find(opt => opt.id === value);
        onSauceSelect(option || null);
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sauceOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value={option.id} id={`sauce-${option.id}`} />
              <Label htmlFor={`sauce-${option.id}`}>{option.name}</Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};
