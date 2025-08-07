import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

interface CartExtrasSectionProps {
  onExtrasChange: (extras: CartExtras) => void;
}

export interface CartExtras {
  sauces: string[];
  accompagnements: string[];
  baguettes: number;
}

export const CartExtrasSection = ({ onExtrasChange }: CartExtrasSectionProps) => {
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [selectedAccompagnements, setSelectedAccompagnements] = useState<string[]>([]);
  const [baguettesCount, setBaguettesCount] = useState<number>(0);

  const saucesOptions = [
    "Soja sucrée",
    "Soja salée",
    "Aucune"
  ];

  const accompagnementsOptions = [
    "Wasabi",
    "Gingembre"
  ];

  const handleSauceChange = (sauce: string, checked: boolean) => {
    let newSauces: string[];
    
    if (sauce === "Aucune") {
      // Si "Aucune" est sélectionnée, on ne garde que celle-ci
      newSauces = checked ? ["Aucune"] : [];
    } else {
      // Si on sélectionne une sauce, on retire "Aucune" et on ajoute/retire la sauce
      const filteredSauces = selectedSauces.filter(s => s !== "Aucune");
      if (checked) {
        newSauces = [...filteredSauces, sauce];
      } else {
        newSauces = filteredSauces.filter(s => s !== sauce);
      }
    }
    
    setSelectedSauces(newSauces);
    onExtrasChange({
      sauces: newSauces,
      accompagnements: selectedAccompagnements,
      baguettes: baguettesCount
    });
  };

  const handleAccompagnementChange = (accompagnement: string, checked: boolean) => {
    const newAccompagnements = checked 
      ? [...selectedAccompagnements, accompagnement]
      : selectedAccompagnements.filter(a => a !== accompagnement);
    
    setSelectedAccompagnements(newAccompagnements);
    onExtrasChange({
      sauces: selectedSauces,
      accompagnements: newAccompagnements,
      baguettes: baguettesCount
    });
  };

  const handleBaguettesChange = (change: number) => {
    const newCount = Math.max(0, baguettesCount + change);
    setBaguettesCount(newCount);
    onExtrasChange({
      sauces: selectedSauces,
      accompagnements: selectedAccompagnements,
      baguettes: newCount
    });
  };

  return (
    <Card className="w-full border-2 border-gold-300 bg-gold-50">
      <CardHeader>
        <CardTitle className="text-gold-800 flex items-center gap-2">
          🍜 Options de commande
          <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
            Obligatoire
          </span>
        </CardTitle>
        <CardDescription className="text-gold-600">
          Veuillez choisir vos préférences pour les sauces et accompagnements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sauces */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            🥢 Sauce
            <span className="text-red-600">*</span>
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {saucesOptions.map((sauce) => (
              <div key={sauce} className="flex items-center space-x-3">
                <Checkbox
                  id={`sauce-${sauce}`}
                  checked={selectedSauces.includes(sauce)}
                  onCheckedChange={(checked) => handleSauceChange(sauce, checked as boolean)}
                  className="border-gold-400 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
                />
                <label 
                  htmlFor={`sauce-${sauce}`} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {sauce}
                </label>
              </div>
            ))}
          </div>
          {selectedSauces.length === 0 && (
            <p className="text-red-600 text-sm">⚠️ Veuillez sélectionner au moins une option</p>
          )}
        </div>

        {/* Accompagnements */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🌶️ Accompagnements</h4>
          <div className="grid grid-cols-1 gap-3">
            {accompagnementsOptions.map((accompagnement) => (
              <div key={accompagnement} className="flex items-center space-x-3">
                <Checkbox
                  id={`accompagnement-${accompagnement}`}
                  checked={selectedAccompagnements.includes(accompagnement)}
                  onCheckedChange={(checked) => handleAccompagnementChange(accompagnement, checked as boolean)}
                  className="border-gold-400 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
                />
                <label 
                  htmlFor={`accompagnement-${accompagnement}`} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {accompagnement}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Baguettes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800">🥢 Baguettes</h4>
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleBaguettesChange(-1)}
              disabled={baguettesCount <= 0}
              className="h-8 w-8 p-0 border-gold-400 hover:bg-gold-100"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[2rem] text-center">
              {baguettesCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleBaguettesChange(1)}
              className="h-8 w-8 p-0 border-gold-400 hover:bg-gold-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 ml-2">paires</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};