
import { Salad, Fish, Banana, Leaf, Soup, Apple } from "lucide-react";

interface AllergyOption {
  id: string;
  name: string;
  icon: JSX.Element;
}

interface AllergiesSelectorProps {
  allergies: string[];
  toggleAllergy: (allergyId: string) => void;
}

export const AllergiesSelector = ({ allergies, toggleAllergy }: AllergiesSelectorProps) => {
  const allergyOptions: AllergyOption[] = [
    { id: "gluten", name: "Gluten", icon: <Salad className="h-4 w-4" /> },
    { id: "crustaces", name: "Crustacés", icon: <Fish className="h-4 w-4" /> },
    { id: "eggs", name: "Œufs", icon: <Banana className="h-4 w-4" /> },
    { id: "fish", name: "Poisson", icon: <Fish className="h-4 w-4" /> },
    { id: "peanuts", name: "Arachides", icon: <Leaf className="h-4 w-4" /> },
    { id: "soy", name: "Soja", icon: <Soup className="h-4 w-4" /> },
    { id: "nuts", name: "Fruits à coque", icon: <Apple className="h-4 w-4" /> },
    { id: "sesame", name: "Sésame", icon: <Leaf className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Allergies</h3>
      <p className="text-sm text-gray-500">Veuillez sélectionner vos allergies éventuelles.</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
        {allergyOptions.map((allergy) => (
          <div
            key={allergy.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              allergies.includes(allergy.id)
                ? "border-gold-500 bg-gold-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => toggleAllergy(allergy.id)}
          >
            <div className="flex items-center space-x-2">
              <div className="text-gray-500">{allergy.icon}</div>
              <span className="text-sm">{allergy.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
