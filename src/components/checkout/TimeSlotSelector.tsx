
import { useState, useEffect } from "react";
import { format, addMinutes, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale/fr";

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

  useEffect(() => {
    generateTimeSlots();
  }, [orderType]);

  const generateTimeSlots = () => {
    const now = new Date();
    const slots: TimeOption[] = [];
    
    // Heure de début (11h30 pour livraison, 11h pour emporter)
    const startHour = orderType === "delivery" ? 11 : 11;
    const startMinute = orderType === "delivery" ? 30 : 0;
    
    // Heure de fin (22h30 pour livraison, 22h pour emporter)
    const endHour = orderType === "delivery" ? 22 : 22;
    const endMinute = orderType === "delivery" ? 30 : 0;

    // Intervalle en minutes (30 minutes pour livraison, 15 minutes pour emporter)
    const interval = orderType === "delivery" ? 30 : 15;

    // Ajout du délai minimum (30 min pour livraison, 20 min pour emporter)
    const minDelay = orderType === "delivery" ? 30 : 20;
    const minTime = addMinutes(now, minDelay);

    // Générer les tranches horaires
    const startDate = new Date();
    startDate.setHours(startHour);
    startDate.setMinutes(startMinute);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    const endDate = new Date();
    endDate.setHours(endHour);
    endDate.setMinutes(endMinute);
    endDate.setSeconds(0);
    endDate.setMilliseconds(0);

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

    // Sélection automatique du premier créneau disponible si aucun n'est sélectionné
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

  // Vérifier si le créneau est disponible aujourd'hui
  const isAvailableToday = () => {
    const now = new Date();
    
    // Si avant l'heure d'ouverture ou après l'heure de fermeture
    const openTime = new Date();
    openTime.setHours(orderType === "delivery" ? 11 : 11);
    openTime.setMinutes(orderType === "delivery" ? 0 : 0);
    openTime.setSeconds(0);
    openTime.setMilliseconds(0);
    
    const closeTime = new Date();
    closeTime.setHours(orderType === "delivery" ? 22 : 22);
    closeTime.setMinutes(0);
    closeTime.setSeconds(0);
    closeTime.setMilliseconds(0);
    
    // Si l'heure actuelle est dans la plage d'ouverture
    return isAfter(now, openTime) && isBefore(now, closeTime);
  };
  
  const formattedDate = format(new Date(), "EEEE d MMMM", { locale: fr });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Horaire de {orderType === "delivery" ? "livraison" : "retrait"}</h3>
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
