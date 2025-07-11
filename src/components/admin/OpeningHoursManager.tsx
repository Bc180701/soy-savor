
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { 
  getWeekOpeningHours, 
  saveRestaurantOpeningHours, 
  DayOpeningHours 
} from "@/services/openingHoursService";

interface DayHours {
  day: string;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const OpeningHoursManager = () => {
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingHours, setOpeningHours] = useState<DayHours[]>([
    { day: "monday", dayName: "Lundi", isOpen: false, openTime: "11:00", closeTime: "22:00" },
    { day: "tuesday", dayName: "Mardi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "wednesday", dayName: "Mercredi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "thursday", dayName: "Jeudi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "friday", dayName: "Vendredi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "saturday", dayName: "Samedi", isOpen: true, openTime: "11:00", closeTime: "22:00" },
    { day: "sunday", dayName: "Dimanche", isOpen: false, openTime: "11:00", closeTime: "22:00" }
  ]);

  const fetchOpeningHours = async () => {
    if (!currentRestaurant) {
      console.log("Aucun restaurant sélectionné");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Chargement des horaires pour le restaurant:", currentRestaurant.name);
      
      const hours = await getWeekOpeningHours(currentRestaurant.id);
      
      if (hours && hours.length > 0) {
        // Convertir les données vers le format du composant
        const formattedData = hours.map(item => ({
          day: item.day,
          dayName: getDayName(item.day),
          isOpen: item.is_open,
          openTime: item.open_time,
          closeTime: item.close_time
        }));
        
        setOpeningHours(formattedData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des horaires:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les horaires d'ouverture",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getDayName = (day: string): string => {
    const dayNames: {[key: string]: string} = {
      "monday": "Lundi",
      "tuesday": "Mardi", 
      "wednesday": "Mercredi",
      "thursday": "Jeudi",
      "friday": "Vendredi",
      "saturday": "Samedi",
      "sunday": "Dimanche"
    };
    return dayNames[day] || day;
  };

  const handleDayToggle = (index: number) => {
    const updatedHours = [...openingHours];
    updatedHours[index].isOpen = !updatedHours[index].isOpen;
    setOpeningHours(updatedHours);
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    const updatedHours = [...openingHours];
    updatedHours[index][field] = value;
    setOpeningHours(updatedHours);
  };

  const saveOpeningHours = async () => {
    if (!currentRestaurant) {
      toast({
        title: "Erreur",
        description: "Aucun restaurant sélectionné",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      console.log("Sauvegarde des horaires pour le restaurant:", currentRestaurant.name);
      
      // Convertir vers le format de l'API
      const hoursData: DayOpeningHours[] = openingHours.map((item, index) => ({
        day: item.day,
        day_order: index,
        is_open: item.isOpen,
        open_time: item.openTime,
        close_time: item.closeTime
      }));
      
      const success = await saveRestaurantOpeningHours(currentRestaurant.id, hoursData);
      
      if (success) {
        toast({
          title: "Horaires sauvegardés",
          description: `Les horaires d'ouverture de ${currentRestaurant.name} ont été mis à jour avec succès`,
        });
      } else {
        throw new Error("Échec de la sauvegarde");
      }
      
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des horaires:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les horaires d'ouverture",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  useEffect(() => {
    fetchOpeningHours();
  }, [currentRestaurant]);

  if (!currentRestaurant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Horaires d'ouverture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Veuillez sélectionner un restaurant pour gérer ses horaires d'ouverture.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Horaires d'ouverture - {currentRestaurant.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 font-semibold pb-2 border-b">
              <div>Jour</div>
              <div>Ouvert</div>
              <div>Heure d'ouverture</div>
              <div>Heure de fermeture</div>
            </div>
            
            {openingHours.map((day, index) => (
              <div key={day.day} className="grid grid-cols-4 gap-4 items-center">
                <div className="font-medium">{day.dayName}</div>
                <div>
                  <Checkbox 
                    checked={day.isOpen} 
                    onCheckedChange={() => handleDayToggle(index)}
                    id={`day-${day.day}`}
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={day.openTime}
                    onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                    disabled={!day.isOpen}
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={day.closeTime}
                    onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                    disabled={!day.isOpen}
                  />
                </div>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-end">
              <Button onClick={saveOpeningHours} disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder les horaires
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpeningHoursManager;
