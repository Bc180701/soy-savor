
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface DeliveryZonesEditorProps {
  data: string[];
  onSave: (data: string[]) => void;
}

const DeliveryZonesEditor = ({ data, onSave }: DeliveryZonesEditorProps) => {
  const [zones, setZones] = useState<string[]>(data);
  const [newZone, setNewZone] = useState("");

  const addZone = () => {
    if (newZone.trim() === "") return;
    if (zones.includes(newZone.trim())) return;
    
    setZones([...zones, newZone.trim()]);
    setNewZone("");
  };

  const removeZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(zones);
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
                  key={index} 
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
