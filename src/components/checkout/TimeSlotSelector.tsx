
import { useState, useEffect } from 'react';
import * as dateFns from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TimeSlotSelectorProps = {
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  deliveryMethod: 'delivery' | 'pickup' | 'dinein';
};

const TimeSlotSelector = ({ selectedTime, setSelectedTime, deliveryMethod }: TimeSlotSelectorProps) => {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Generate time slots for today
  useEffect(() => {
    const generateTimeSlots = () => {
      const now = new Date();
      const slots: string[] = [];
      
      // Start time is either current time + 30 min for delivery or current time + 15 min for pickup
      let startMinutes = now.getMinutes();
      let roundedStartMinutes = Math.ceil(startMinutes / 15) * 15;
      
      let startTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        roundedStartMinutes
      );
      
      // Add preparation time based on delivery method
      const preparationTime = deliveryMethod === 'delivery' ? 45 : 30;
      startTime = dateFns.addMinutes(startTime, preparationTime);
      
      // Restaurant opens at 11:00 and closes at 22:00 (10:00 PM)
      const openingTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        11,
        0
      );
      
      const closingTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        22,
        0
      );
      
      // If current time + preparation is before opening time, start from opening time
      if (dateFns.isAfter(openingTime, startTime)) {
        startTime = openingTime;
      }
      
      const formattedDate = dateFns.format(now, "EEEE d MMMM", { locale: fr });
      const formattedTime = dateFns.format(now, "HH:mm");
      
      setCurrentDate(now);
      
      // Generate slots every 15 minutes until closing time
      let currentSlot = startTime;
      while (dateFns.isAfter(closingTime, currentSlot) || dateFns.isBefore(closingTime, dateFns.addMinutes(currentSlot, 15))) {
        slots.push(dateFns.format(currentSlot, "HH:mm"));
        currentSlot = dateFns.addMinutes(currentSlot, 15);
      }
      
      return slots;
    };
    
    setTimeSlots(generateTimeSlots());
  }, [deliveryMethod]);
  
  const getTimeDisplay = (timeSlot: string) => {
    // Get hours and minutes from the time slot string (format: "HH:mm")
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    // Create a new date object with today's date and the time slot
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    
    // Check if the time slot is available (not in the past)
    const now = new Date();
    const isAvailable = dateFns.isAfter(date, now) && dateFns.isBefore(date, new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0));
    
    // Format the time to display
    const formattedTime = dateFns.format(date, "HH'h'mm", { locale: fr });
    
    return {
      display: formattedTime,
      isAvailable
    };
  };
  
  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Clock size={18} className="mr-2 text-gold-500" />
          <h3 className="text-lg font-medium">Heure de {deliveryMethod === 'delivery' ? 'livraison' : deliveryMethod === 'pickup' ? 'retrait' : 'réservation'}</h3>
        </div>
        <p className="text-sm text-gray-500">
          {deliveryMethod === 'delivery' 
            ? 'Choisissez l\'heure à laquelle vous souhaitez être livré'
            : deliveryMethod === 'pickup'
              ? 'Choisissez l\'heure à laquelle vous passerez chercher votre commande'
              : 'Choisissez l\'heure à laquelle vous souhaitez manger sur place'}
        </p>
      </div>
      
      <div className="border rounded-md p-4 bg-white">
        <p className="font-medium mb-3 text-gray-700">
          {dateFns.format(currentDate, "EEEE d MMMM", { locale: fr })}
        </p>
        
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((timeSlot) => {
            const { display, isAvailable } = getTimeDisplay(timeSlot);
            return (
              <Button
                key={timeSlot}
                variant={selectedTime === timeSlot ? "default" : "outline"}
                className={`flex items-center justify-center h-10 ${
                  selectedTime === timeSlot ? 'bg-gold-500 hover:bg-gold-600 text-black border-gold-500' : 'border'
                } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setSelectedTime(timeSlot)}
                disabled={!isAvailable}
              >
                {display}
                {selectedTime === timeSlot && (
                  <CheckCircle2 size={16} className="ml-1" />
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimeSlotSelector;
