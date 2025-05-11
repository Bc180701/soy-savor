
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  addMinutes, 
  set, 
  isAfter, 
  isBefore, 
  format 
} from "date-fns";

interface TimeSlotSelectorProps {
  onSelect: (time: string) => void;
  orderType: "delivery" | "pickup";
}

const TimeSlotSelector = ({ onSelect, orderType }: TimeSlotSelectorProps) => {
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateAvailableTimeSlots();
  }, [orderType]);

  const handleTimeSelect = (value: string) => {
    setSelectedTime(value);
    onSelect(value);
  };

  const generateAvailableTimeSlots = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      let startTime: Date;
      let endTime: Date;
      const timeSlots: string[] = [];
      const intervalMinutes = 15;

      // Définir les heures d'ouverture
      const openingHour = 11; // 11h00
      const closingHour = 22; // 22h00 (10PM)
      
      // Si l'heure actuelle + 30 minutes (délai minimum) est avant l'heure d'ouverture, commencer à l'heure d'ouverture
      const minimumPreparationTime = orderType === "pickup" ? 30 : 45; // 30 min pour emporter, 45 min pour livraison
      
      // Calculer l'heure de début
      const earliestPossibleTime = addMinutes(now, minimumPreparationTime);
      
      // Vérifier si nous sommes avant l'heure d'ouverture
      const todayOpeningTime = set(new Date(), { hours: openingHour, minutes: 0, seconds: 0 });
      if (isAfter(todayOpeningTime, earliestPossibleTime)) {
        startTime = todayOpeningTime;
      } else {
        // Arrondir à l'intervalle de 15 minutes suivant
        const minutes = Math.ceil(earliestPossibleTime.getMinutes() / intervalMinutes) * intervalMinutes;
        startTime = set(new Date(earliestPossibleTime), {
          minutes: minutes,
          seconds: 0,
          milliseconds: 0
        });
      }
      
      // L'heure de fermeture pour aujourd'hui
      endTime = set(new Date(), { hours: closingHour, minutes: 0, seconds: 0 });
      
      // Récupérer les créneaux déjà réservés pour aujourd'hui
      const { data: reservedSlots } = await supabase
        .from('orders')
        .select('scheduled_for')
        .gte('scheduled_for', new Date().toISOString())
        .lt('scheduled_for', new Date(new Date().setHours(23, 59, 59, 999)).toISOString());
        
      // Créer un objet pour compter les réservations par créneau
      const slotsCount: Record<string, number> = {};
      reservedSlots?.forEach(order => {
        const time = new Date(order.scheduled_for).toTimeString().substring(0, 5);
        slotsCount[time] = (slotsCount[time] || 0) + 1;
      });
      
      // Maximum 4 commandes par créneau de 15 minutes
      const maxOrdersPerSlot = 4;
      
      // Générer les créneaux disponibles
      let currentTime = new Date(startTime);
      while (isAfter(endTime, currentTime) || isBefore(endTime, set(currentTime, {hours: 0, minutes: 0}))) {
        const timeString = format(currentTime, 'HH:mm');
        const nextTimeString = format(addMinutes(currentTime, intervalMinutes), 'HH:mm');
        
        // Vérifier si le créneau n'est pas complet
        if ((slotsCount[timeString] || 0) < maxOrdersPerSlot) {
          timeSlots.push(timeString);
        }
        
        currentTime = addMinutes(currentTime, intervalMinutes);
      }
      
      setAvailableTimeSlots(timeSlots);
    } catch (error) {
      console.error("Erreur lors de la génération des créneaux horaires", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Choisissez un horaire {orderType === "delivery" ? "de livraison" : "de retrait"}
        </h2>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : availableTimeSlots.length > 0 ? (
          <RadioGroup value={selectedTime} onValueChange={handleTimeSelect} className="space-y-2">
            {availableTimeSlots.map((time) => (
              <div key={time} className="flex items-center space-x-2">
                <RadioGroupItem value={time} id={`time-${time}`} />
                <Label htmlFor={`time-${time}`} className="cursor-pointer">
                  {time}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="text-center py-6 text-gray-500">
            Aucun créneau disponible pour aujourd'hui.
            <br />
            Veuillez réessayer demain.
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotSelector;
