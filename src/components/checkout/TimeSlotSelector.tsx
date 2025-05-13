
import { useState, useEffect } from "react";
import { format, addMinutes, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";

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

    const startHour = 11;
    const startMinute = orderType === "delivery" ? 30 : 0;

    const endHour = 22;
    const endMinute = orderType === "delivery" ? 30 : 0;

    const interval = orderType === "delivery" ? 30 : 15;
    const minDelay = orderType === "delivery" ? 30 : 20;
    const minTime = addMinutes(now, minDelay);

    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);

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

  const isAvailableToday = () => {
    const now = new Date();

    const openTime = new Date();
    openTime.setHours(11, 0, 0, 0);

    const closeTime = new Date();
    closeTime.setHours(22, 0, 0, 0);

    return isAfter(now, openTime) && isBefore(now, closeTime);
  };

  const formattedDate = format(new Date(), "EEEE d MMMM", { locale: fr });

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
