
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
  slotNumber: number;
}

const OpeningHoursManager = () => {
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingHours, setOpeningHours] = useState<DayHours[]>([]);

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
          closeTime: item.close_time,
          slotNumber: item.slot_number || 1
        }));
        
        setOpeningHours(formattedData);
      } else {
        // Initialiser avec des horaires par défaut si aucune donnée
        setOpeningHours(getDefaultDayHours());
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

  const getDefaultDayHours = (): DayHours[] => {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const result: DayHours[] = [];
    
    days.forEach(day => {
      // Créneau par défaut unique
      result.push({
        day,
        dayName: getDayName(day),
        isOpen: day !== "monday" && day !== "sunday",
        openTime: "11:00",
        closeTime: "22:00",
        slotNumber: 1
      });
    });
    
    return result;
  };

  const addTimeSlot = (day: string) => {
    const daySlots = openingHours.filter(h => h.day === day);
    const newSlotNumber = Math.max(...daySlots.map(s => s.slotNumber), 0) + 1;
    
    const newSlot: DayHours = {
      day,
      dayName: getDayName(day),
      isOpen: true,
      openTime: "18:00",
      closeTime: "22:00",
      slotNumber: newSlotNumber
    };
    
    setOpeningHours([...openingHours, newSlot]);
  };

  const removeTimeSlot = (day: string, slotNumber: number) => {
    // Ne pas supprimer s'il n'y a qu'un seul créneau pour ce jour
    const daySlots = openingHours.filter(h => h.day === day);
    if (daySlots.length <= 1) return;
    
    setOpeningHours(openingHours.filter(h => !(h.day === day && h.slotNumber === slotNumber)));
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
      const hoursData: DayOpeningHours[] = openingHours.map((item) => ({
        day: item.day,
        day_order: getDayOrder(item.day),
        is_open: item.isOpen,
        open_time: item.openTime,
        close_time: item.closeTime,
        slot_number: item.slotNumber
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
  
  const getDayOrder = (day: string): number => {
    const dayOrder: {[key: string]: number} = {
      "sunday": 0,
      "monday": 1,
      "tuesday": 2,
      "wednesday": 3,
      "thursday": 4,
      "friday": 5,
      "saturday": 6
    };
    return dayOrder[day] || 0;
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
            {(() => {
              const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
              return days.map(day => {
                const daySlots = openingHours.filter(h => h.day === day).sort((a, b) => a.slotNumber - b.slotNumber);
                const dayName = getDayName(day);
                
                return (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{dayName}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(day)}
                        className="text-xs"
                      >
                        + Ajouter un créneau
                      </Button>
                    </div>
                    
                    {daySlots.length === 0 ? (
                      <div className="text-gray-500 italic">Aucun créneau configuré</div>
                    ) : (
                      daySlots.map((slot, slotIndex) => (
                        <div key={`${slot.day}-${slot.slotNumber}`} className="grid grid-cols-6 gap-4 items-center p-3 border rounded-lg">
                          <div className="text-sm font-medium">
                            Créneau {slot.slotNumber}
                          </div>
                          <div>
                            <Checkbox 
                              checked={slot.isOpen} 
                              onCheckedChange={() => {
                                const index = openingHours.findIndex(h => h.day === slot.day && h.slotNumber === slot.slotNumber);
                                handleDayToggle(index);
                              }}
                              id={`day-${slot.day}-${slot.slotNumber}`}
                            />
                            <label htmlFor={`day-${slot.day}-${slot.slotNumber}`} className="ml-2 text-sm">
                              Ouvert
                            </label>
                          </div>
                          <div>
                            <Input
                              type="time"
                              value={slot.openTime}
                              onChange={(e) => {
                                const index = openingHours.findIndex(h => h.day === slot.day && h.slotNumber === slot.slotNumber);
                                handleTimeChange(index, 'openTime', e.target.value);
                              }}
                              disabled={!slot.isOpen}
                              placeholder="Ouverture"
                            />
                          </div>
                          <div>
                            <Input
                              type="time"
                              value={slot.closeTime}
                              onChange={(e) => {
                                const index = openingHours.findIndex(h => h.day === slot.day && h.slotNumber === slot.slotNumber);
                                handleTimeChange(index, 'closeTime', e.target.value);
                              }}
                              disabled={!slot.isOpen}
                              placeholder="Fermeture"
                            />
                          </div>
                          <div className="col-span-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {slot.isOpen ? `${slot.openTime} - ${slot.closeTime}` : 'Fermé'}
                            </span>
                            {daySlots.length > 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeTimeSlot(slot.day, slot.slotNumber)}
                                className="text-xs h-6 px-2"
                              >
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              });
            })()}
            
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
