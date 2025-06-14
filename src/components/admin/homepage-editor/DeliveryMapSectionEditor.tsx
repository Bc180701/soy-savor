
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DeliveryMapSection } from "@/hooks/useHomepageData";

interface DeliveryMapSectionEditorProps {
  data?: DeliveryMapSection;
  onSave: (data: DeliveryMapSection) => void;
}

const DeliveryMapSectionEditor = ({ data, onSave }: DeliveryMapSectionEditorProps) => {
  const [formData, setFormData] = useState<DeliveryMapSection>({
    title: "Zones de livraison",
    subtitle: "Nous livrons dans les communes suivantes autour de Châteaurenard. Commandez en ligne et recevez vos sushis directement chez vous !",
    restaurant_info: {
      name: "SushiEats Châteaurenard",
      address: "16 cours Carnot, 13160 Châteaurenard",
      subtitle: "Point de départ des livraisons"
    },
    no_zones_message: "Aucune zone de livraison n'est actuellement définie."
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRestaurantInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      restaurant_info: {
        ...prev.restaurant_info,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave(formData);
      toast({
        title: "Section de la carte de livraison enregistrée",
        description: "Les modifications ont été sauvegardées avec succès",
        variant: "success"
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-gray-200">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Titre de la section
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Zones de livraison"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subtitle" className="text-sm font-medium">
              Sous-titre
            </Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="Description de la zone de livraison"
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Informations du restaurant</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="restaurant-name" className="text-sm font-medium">
                  Nom du restaurant
                </Label>
                <Input
                  id="restaurant-name"
                  value={formData.restaurant_info.name}
                  onChange={(e) => handleRestaurantInfoChange('name', e.target.value)}
                  placeholder="SushiEats Châteaurenard"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="restaurant-address" className="text-sm font-medium">
                  Adresse du restaurant
                </Label>
                <Input
                  id="restaurant-address"
                  value={formData.restaurant_info.address}
                  onChange={(e) => handleRestaurantInfoChange('address', e.target.value)}
                  placeholder="16 cours Carnot, 13160 Châteaurenard"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="restaurant-subtitle" className="text-sm font-medium">
                  Sous-titre du restaurant
                </Label>
                <Input
                  id="restaurant-subtitle"
                  value={formData.restaurant_info.subtitle}
                  onChange={(e) => handleRestaurantInfoChange('subtitle', e.target.value)}
                  placeholder="Point de départ des livraisons"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="no-zones-message" className="text-sm font-medium">
              Message affiché quand aucune zone n'est définie
            </Label>
            <Input
              id="no-zones-message"
              value={formData.no_zones_message}
              onChange={(e) => handleChange('no_zones_message', e.target.value)}
              placeholder="Aucune zone de livraison n'est actuellement définie."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={isSaving}
          className="bg-gold-600 hover:bg-gold-700 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
};

export default DeliveryMapSectionEditor;
