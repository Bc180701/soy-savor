
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, isAfter, isBefore, set } from "date-fns";
import { fr } from "date-fns/locale";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  dateTime: Date;
}

interface TimeSlotSelectorProps {
  onSelect: (timeSlot: string) => void;
  orderType: "delivery" | "pickup";
}

const TimeSlotSelector = ({ onSelect, orderType }: TimeSlotSelectorProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('time_slots')
          .select('*')
          .eq('available', true)
          .order('time', { ascending: true });
        
        if (error) {
          console.error("Error fetching time slots:", error);
          return;
        }
        
        // Générer des créneaux à partir de l'heure actuelle
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Déterminer le délai de préparation en minutes
        const preparationDelay = orderType === "delivery" ? 45 : 30; // 45 min pour livraison, 30 min pour retrait
        
        // Heure minimale de retrait/livraison
        const minPickupTime = addMinutes(now, preparationDelay);
        
        // Arrondir à la prochaine demi-heure
        const roundedMinutes = currentMinute < 30 ? 30 : 0;
        const roundedHour = currentMinute < 30 ? currentHour : currentHour + 1;
        
        // Créer un tableau pour stocker les créneaux
        const slotsToGenerate = [];
        
        // Heure d'ouverture et de fermeture du restaurant (pour aujourd'hui)
        const openingHour = 11; // 11h00
        const closingHour = 22; // 22h00
        
        // Déterminer l'heure de départ pour les créneaux
        let startHour = roundedHour;
        let startMinute = roundedMinutes;
        
        // Si l'heure minimale de retrait/livraison est après l'heure arrondie, utiliser l'heure minimale
        const roundedDateTime = set(now, { hours: roundedHour, minutes: roundedMinutes, seconds: 0, milliseconds: 0 });
        if (isAfter(minPickupTime, roundedDateTime)) {
          startHour = minPickupTime.getHours();
          startMinute = Math.ceil(minPickupTime.getMinutes() / 30) * 30;
          if (startMinute === 60) {
            startHour += 1;
            startMinute = 0;
          }
        }
        
        // Si l'heure de départ est avant l'heure d'ouverture, utiliser l'heure d'ouverture
        if (startHour < openingHour) {
          startHour = openingHour;
          startMinute = 0;
        }
        
        // Si l'heure de départ est après l'heure de fermeture, pas de créneaux disponibles
        if (startHour >= closingHour) {
          setTimeSlots([]);
          setLoading(false);
          return;
        }
        
        // Générer les créneaux par intervalles de 30 minutes
        for (let h = startHour; h < closingHour; h++) {
          // Pour la première heure, commencer à partir de la minute calculée
          const minutesToInclude = h === startHour ? [startMinute] : [0, 30];
          
          for (const m of minutesToInclude) {
            if (h === startHour && m < startMinute) continue;
            
            const slotTime = new Date();
            slotTime.setHours(h, m, 0, 0);
            
            // Vérifier si le créneau est dans le futur et avant la fermeture
            if (isAfter(slotTime, now) && isBefore(slotTime, set(now, { hours: closingHour, minutes: 0 }))) {
              const formattedTime = format(slotTime, 'HH:mm');
              const readableTime = format(slotTime, 'HH:mm', { locale: fr });
              
              slotsToGenerate.push({
                id: `slot-${h}-${m}`,
                time: readableTime,
                available: true,
                dateTime: slotTime
              });
            }
          }
        }
        
        setTimeSlots(slotsToGenerate);
      } catch (error) {
        console.error("Error in time slot fetch:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [orderType]);

  const handleTimeSelect = (timeId: string) => {
    setSelectedSlot(timeId);
    const slot = timeSlots.find(s => s.id === timeId);
    if (slot) {
      onSelect(slot.time);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {orderType === "delivery" ? "Heure de livraison souhaitée" : "Heure de retrait souhaitée"}
      </h3>
      
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <RadioGroup
          value={selectedSlot}
          onValueChange={handleTimeSelect}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          {timeSlots.map((slot) => (
            <div 
              key={slot.id} 
              className="border rounded-md p-3 hover:bg-gray-50 flex items-center space-x-2"
            >
              <RadioGroupItem value={slot.id} id={slot.id} />
              <Label htmlFor={slot.id}>{slot.time}</Label>
            </div>
          ))}
        </RadioGroup>
      )}
      
      {timeSlots.length === 0 && !loading && (
        <div className="text-center py-4 text-gray-500">
          {orderType === "delivery" 
            ? "Aucun créneau de livraison disponible pour aujourd'hui" 
            : "Aucun créneau de retrait disponible pour aujourd'hui"}
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;
