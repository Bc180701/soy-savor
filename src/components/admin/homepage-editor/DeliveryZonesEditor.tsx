
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DeliveryZonesEditorProps {
  data: string[];
  onSave: (data: string[]) => void;
}

const DeliveryZonesEditor = ({ data, onSave }: DeliveryZonesEditorProps) => {
  const [zones, setZones] = useState<string[]>(data || []);
  const [newZone, setNewZone] = useState("");
  const { toast } = useToast();

  // Reset zones when data prop changes
  useState(() => {
    setZones(data || []);
  }, [data]);

  const addZone = () => {
    if (newZone.trim() === "") return;
    
    // Vérifier si la zone existe déjà (insensible à la casse)
    const normalizedZone = newZone.trim();
    const exists = zones.some(zone => zone.toLowerCase() === normalizedZone.toLowerCase());
    
    if (exists) {
      toast({
        title: "Zone déjà existante",
        description: `La zone "${normalizedZone}" existe déjà dans la liste`,
        variant: "destructive"
      });
      return;
    }
    
    const updatedZones = [...zones, normalizedZone];
    setZones(updatedZones);
    setNewZone("");
    
    console.log("Zone ajoutée:", normalizedZone);
    console.log("Zones mises à jour:", updatedZones);
  };

  const removeZone = (index: number) => {
    const removed = zones[index];
    const updatedZones = zones.filter((_, i) => i !== index);
    setZones(updatedZones);
    
    console.log("Zone supprimée:", removed);
    console.log("Zones restantes:", updatedZones);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier si des changements ont été effectués
    const hasChanges = JSON.stringify(zones) !== JSON.stringify(data);
    
    if (!hasChanges) {
      toast({
        title: "Aucun changement",
        description: "Aucune modification n'a été détectée",
        variant: "default"
      });
      return;
    }
    
    console.log("Sauvegarde des zones:", zones);
    onSave(zones);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addZone();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nouvelle zone de livraison"
                className="flex-1"
              />
              <Button 
                type="button"
                onClick={addZone}
              >
                <Plus className="h-4 w-4 mr-2" /> Ajouter
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              {zones.map((zone, index) => (
                <Badge 
                  key={`zone-${index}-${zone}`}
                  variant="secondary"
                  className="text-sm py-1.5 px-3"
                >
                  {zone}
                  <button
                    type="button"
                    className="ml-2 text-gray-500 hover:text-red-500"
                    onClick={() => removeZone(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {zones.length === 0 && (
                <p className="text-sm text-gray-500 italic">Aucune zone de livraison ajoutée</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button type="submit" className="bg-gold-600 hover:bg-gold-700 text-white">
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
};

export default DeliveryZonesEditor;
