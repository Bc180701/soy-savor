
import { useState, useEffect } from "react";
import { format, addMinutes, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { isRestaurantOpenNow, getWeekOpeningHours } from "@/services/openingHoursService";

interface TimeOption {
  label: string;
  value: string;
  disabled: boolean;
}

interface TimeSlotSelectorProps {
  orderType: "delivery" | "pickup";
  onSelect: (time: string) => void;
  selectedTime?: string;
}

const TimeSlotSelector = ({ orderType, onSelect, selectedTime }: TimeSlotSelectorProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(selectedTime || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [todayOpeningHours, setTodayOpeningHours] = useState<{
    is_open: boolean;
    open_time: string;
    close_time: string;
  } | null>(null);

  useEffect(() => {
    const checkOpeningStatus = async () => {
      setIsLoading(true);
      
      try {
        // Check if restaurant is open today
        const open = await isRestaurantOpenNow();
        setIsOpen(open);
        
        // Get all opening hours
        const weekHours = await getWeekOpeningHours();
        
        if (weekHours.length > 0) {
          const today = new Date();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDay = days[today.getDay()];
          
          const todayHours = weekHours.find(day => day.day === currentDay);
          
          if (todayHours) {
            setTodayOpeningHours({
              is_open: todayHours.is_open,
              open_time: todayHours.open_time,
              close_time: todayHours.close_time
            });
          }
        }
      } catch (error) {
        console.error("Error checking opening status:", error);
        setTodayOpeningHours(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOpeningStatus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      generateTimeSlots();
    }
  }, [orderType, isLoading, todayOpeningHours]);

  const generateTimeSlots = () => {
    const now = new Date();
    const slots: TimeOption[] = [];

    // Si nous sommes fermés aujourd'hui ou pas d'horaires trouvés
    if (!todayOpeningHours || !todayOpeningHours.is_open) {
      setTimeSlots([]);
      return;
    }

    // Convertir les heures d'ouverture et de fermeture en objets Date
    const today = new Date();
    
    const openTimeParts = todayOpeningHours.open_time.split(':');
    const openHour = parseInt(openTimeParts[0], 10);
    const openMinute = parseInt(openTimeParts[1], 10);
    
    const closeTimeParts = todayOpeningHours.close_time.split(':');
    const closeHour = parseInt(closeTimeParts[0], 10);
    const closeMinute = parseInt(closeTimeParts[1], 10);

    const startDate = new Date();
    startDate.setHours(openHour, openMinute, 0, 0);

    const endDate = new Date();
    endDate.setHours(closeHour, closeMinute, 0, 0);

    // Ajuster pour le délai de livraison ou de retrait
    const interval = orderType === "delivery" ? 30 : 15;
    const minDelay = orderType === "delivery" ? 30 : 20;
    const minTime = addMinutes(now, minDelay);

    let currentTime = startDate;

    while (currentTime <= endDate) {
      const isDisabled = isAfter(minTime, currentTime);

      slots.push({
        label: format(currentTime, "HH'h'mm", { locale: fr }),
        value: format(currentTime, "HH:mm"),
        disabled: isDisabled,
      });

      currentTime = addMinutes(currentTime, interval);
    }

    setTimeSlots(slots);

    // Sélectionner automatiquement le premier créneau disponible si aucun n'est sélectionné
    if (!selectedTime) {
      const firstAvailable = slots.find((slot) => !slot.disabled);
      if (firstAvailable) {
        setSelectedSlot(firstAvailable.value);
        onSelect(firstAvailable.value);
      }
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedSlot(time);
    onSelect(time);
  };

  const formattedDate = format(new Date(), "EEEE d MMMM", { locale: fr });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          Horaire de {orderType === "delivery" ? "livraison" : "retrait"}
        </h3>
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Si le restaurant est fermé aujourd'hui
  if (!todayOpeningHours || !todayOpeningHours.is_open) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          Horaire de {orderType === "delivery" ? "livraison" : "retrait"}
        </h3>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
          <p className="text-amber-800">
            Nous sommes fermés aujourd'hui. Veuillez sélectionner un autre jour pour votre commande.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        Horaire de {orderType === "delivery" ? "livraison" : "retrait"}
      </h3>
      <p className="text-sm text-gray-500">
        Choisissez l'heure à laquelle vous souhaitez {orderType === "delivery" ? "être livré" : "récupérer votre commande"} pour {formattedDate}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {timeSlots.map((slot) => (
          <button
            key={slot.value}
            className={`p-2 border rounded-md text-center transition ${
              selectedSlot === slot.value
                ? "bg-gold-500 border-gold-600 text-black"
                : slot.disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gold-50"
            }`}
            onClick={() => !slot.disabled && handleTimeSelect(slot.value)}
            disabled={slot.disabled}
          >
            {slot.label}
          </button>
        ))}
      </div>

      {timeSlots.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-500">
            Aucun créneau disponible pour aujourd'hui.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;
