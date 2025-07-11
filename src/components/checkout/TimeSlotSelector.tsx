
import { useState, useEffect } from "react";
import { format, addMinutes, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { isRestaurantOpenNow, getWeekOpeningHours } from "@/services/openingHoursService";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

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
  const { currentRestaurant } = useRestaurantContext();
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
      if (!currentRestaurant) {
        console.log("🔍 [TimeSlotSelector] Aucun restaurant sélectionné");
        setIsLoading(false);
        return;
      }

      console.log("🔍 [TimeSlotSelector] Vérification statut pour:", currentRestaurant.name, currentRestaurant.id);
      setIsLoading(true);
      
      try {
        // Vérifier si le restaurant est ouvert aujourd'hui
        const open = await isRestaurantOpenNow(currentRestaurant.id);
        console.log("🔍 [TimeSlotSelector] Restaurant ouvert:", open);
        setIsOpen(open);
        
        // Récupérer tous les horaires d'ouverture
        const weekHours = await getWeekOpeningHours(currentRestaurant.id);
        console.log("🔍 [TimeSlotSelector] Horaires semaine:", weekHours);
        
        if (weekHours.length > 0) {
          const today = new Date();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDay = days[today.getDay()];
          
          console.log("🔍 [TimeSlotSelector] Jour actuel:", currentDay, today.getDay());
          
          const todayHours = weekHours.find(day => day.day === currentDay);
          console.log("🔍 [TimeSlotSelector] Horaires du jour trouvées:", todayHours);
          
          if (todayHours) {
            setTodayOpeningHours({
              is_open: todayHours.is_open,
              open_time: todayHours.open_time,
              close_time: todayHours.close_time
            });
            console.log("✅ [TimeSlotSelector] Horaires configurées:", todayHours);
          } else {
            // Si aucune donnée n'est trouvée pour ce jour, marquer comme fermé
            console.log("⚠️ [TimeSlotSelector] Aucune donnée pour ce jour, considéré comme fermé");
            setTodayOpeningHours({
              is_open: false,
              open_time: "11:00",
              close_time: "22:00"
            });
          }
        } else {
          console.log("⚠️ [TimeSlotSelector] Aucune donnée d'horaires, utilisation par défaut");
          setTodayOpeningHours({
            is_open: true,
            open_time: "11:00",
            close_time: "22:00"
          });
        }
      } catch (error) {
        console.error("❌ [TimeSlotSelector] Erreur lors de la vérification:", error);
        // En cas d'erreur, utiliser des horaires par défaut pour ne pas bloquer l'utilisateur
        setTodayOpeningHours({
          is_open: true,
          open_time: "11:00",
          close_time: "22:00"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOpeningStatus();
  }, [currentRestaurant]);

  useEffect(() => {
    if (!isLoading && todayOpeningHours) {
      console.log("🔍 [TimeSlotSelector] Génération créneaux avec:", todayOpeningHours);
      generateTimeSlots();
    }
  }, [orderType, isLoading, todayOpeningHours]);

  const generateTimeSlots = () => {
    if (!todayOpeningHours) {
      console.log("⚠️ [TimeSlotSelector] Pas d'horaires disponibles");
      return;
    }
    
    const now = new Date();
    const slots: TimeOption[] = [];

    console.log("🔍 [TimeSlotSelector] Génération créneaux - Restaurant ouvert:", todayOpeningHours.is_open);

    // Si nous sommes fermés aujourd'hui
    if (!todayOpeningHours.is_open) {
      console.log("❌ [TimeSlotSelector] Restaurant fermé aujourd'hui");
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

    console.log("🔍 [TimeSlotSelector] Heures:", {
      startDate: startDate.toLocaleTimeString(),
      endDate: endDate.toLocaleTimeString(),
      now: now.toLocaleTimeString()
    });

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

    console.log("✅ [TimeSlotSelector] Créneaux générés:", slots.length);
    setTimeSlots(slots);

    // Sélectionner automatiquement le premier créneau disponible si aucun n'est sélectionné
    if (!selectedTime) {
      const firstAvailable = slots.find((slot) => !slot.disabled);
      if (firstAvailable) {
        setSelectedSlot(firstAvailable.value);
        onSelect(firstAvailable.value);
        console.log("✅ [TimeSlotSelector] Premier créneau sélectionné:", firstAvailable.value);
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
