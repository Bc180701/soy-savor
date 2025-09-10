
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SushiOption } from "@/types/sushi-creator";

interface GarnituresSelectionProps {
  selectedGarnitures: SushiOption[];
  garnituresOptions: SushiOption[];
  onGarnitureSelect: (option: SushiOption) => void;
}

export const GarnituresSelection = ({ selectedGarnitures, garnituresOptions, onGarnitureSelect }: GarnituresSelectionProps) => {
  console.log("🥗 GarnituresSelection render - options:", garnituresOptions);
  
  if (garnituresOptions.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Choisis tes garnitures (1 choix inclus)</h3>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-gray-600">Aucune garniture disponible pour le moment.</p>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez ajouter des ingrédients de type "ingredient" dans la section administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Choisis tes garnitures (1 choix inclus)</h3>
      <p className="text-sm text-gray-500 mb-4">
        Le premier choix est inclus, chaque garniture supplémentaire: +1€
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {garnituresOptions.map((option) => (
          <div key={option.id} className="flex items-center space-x-2 mb-2">
            <Checkbox 
              id={`garniture-${option.id}`} 
              checked={selectedGarnitures.some(item => item.id === option.id)}
              onCheckedChange={() => onGarnitureSelect(option)}
            />
            <Label htmlFor={`garniture-${option.id}`}>{option.name}</Label>
          </div>
        ))}
      </div>
      {selectedGarnitures.length > 1 && (
        <p className="text-sm text-gold-600 mt-2">
          +{selectedGarnitures.length - 1}€ pour {selectedGarnitures.length - 1} garniture(s) supplémentaire(s)
        </p>
      )}
    </div>
  );
};
