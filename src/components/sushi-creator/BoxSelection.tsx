
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BoxOption } from "@/types/sushi-creator";

interface BoxSelectionProps {
  selectedBox: BoxOption | null;
  boxOptions: BoxOption[];
  onBoxSelect: (box: BoxOption | null) => void;
}

export const BoxSelection = ({ selectedBox, boxOptions, onBoxSelect }: BoxSelectionProps) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis ta box</h3>
      <p className="text-sm text-gray-600 mb-4">
        1 création = 6 pièces personnalisées<br/>
        Formule: 3 créations achetées = 1 création offerte
      </p>
      <RadioGroup value={selectedBox?.id || ""} onValueChange={(value) => {
        const box = boxOptions.find(box => box.id === value);
        onBoxSelect(box || null);
      }}>
        {boxOptions.map((box) => (
          <div key={box.id} className="flex items-center space-x-2 mb-4">
            <RadioGroupItem value={box.id} id={box.id} />
            <Label htmlFor={box.id} className="flex-1">
              <div className="flex justify-between">
                <span>{box.name} ({box.description})</span>
                <span className="font-semibold">{box.price}€</span>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      {/* Image promotionnelle */}
      <div className="flex justify-center mt-6 mb-4">
        <img 
          src="/lovable-uploads/13d05a8a-41b7-4bef-adce-6112f0546d2d.png" 
          alt="3 créations achetées = 1 offerte"
          className="max-w-xs w-full h-auto"
        />
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Tout supplément au-delà des choix inclus: +1€
      </p>
    </div>
  );
};
