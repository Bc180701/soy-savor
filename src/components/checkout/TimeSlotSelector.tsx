
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
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
        
        // Create time slots if none exist (for demo purposes)
        if (!data || data.length === 0) {
          // Generate time slots from current hour to closing time (22:00)
          const currentHour = new Date().getHours();
          const slotsToGenerate = [];
          
          // Start 1 hour from now, rounded to nearest 30 mins
          const startHour = currentHour + 1;
          
          for (let h = startHour; h <= 22; h++) {
            slotsToGenerate.push({ 
              id: `slot-${h}-00`,
              time: `${h}:00`, 
              available: true 
            });
            // Add half-hour slots
            if (h < 22) {
              slotsToGenerate.push({ 
                id: `slot-${h}-30`,
                time: `${h}:30`, 
                available: true 
              });
            }
          }
          
          setTimeSlots(slotsToGenerate);
        } else {
          setTimeSlots(data);
        }
      } catch (error) {
        console.error("Error in time slot fetch:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, []);

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
          Aucun créneau disponible pour aujourd'hui
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;
