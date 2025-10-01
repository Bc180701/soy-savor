
import { useState, useEffect } from "react";
import { format, addMinutes, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { isRestaurantOpenNow, getWeekOpeningHours } from "@/services/openingHoursService";
import { supabase } from "@/integrations/supabase/client";
import type { Restaurant } from "@/types/restaurant";

interface TimeOption {
  label: string;
  value: string;
  disabled: boolean;
}

interface TimeSlotSelectorProps {
  orderType: "delivery" | "pickup";
  onSelect: (time: string) => void;
  selectedTime?: string;
  cartRestaurant?: Restaurant | null;
}

const TimeSlotSelector = ({ orderType, onSelect, selectedTime, cartRestaurant }: TimeSlotSelectorProps) => {
  const [timeSlots, setTimeSlots] = useState<TimeOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(selectedTime || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [todayOpeningHours, setTodayOpeningHours] = useState<{
    is_open: boolean;
    open_time: string;
    close_time: string;
    slot_number: number;
  }[] | null>(null);

  useEffect(() => {
    const checkOpeningStatus = async () => {
      if (!cartRestaurant) {
        console.log("🔍 [TimeSlotSelector] Aucun restaurant du panier fourni");
        setIsLoading(false);
        return;
      }

      console.log("🔍 [TimeSlotSelector] Vérification statut pour:", cartRestaurant.name, cartRestaurant.id);
      setIsLoading(true);
      
      try {
        // Vérifier si le restaurant est ouvert aujourd'hui
        const open = await isRestaurantOpenNow(cartRestaurant.id);
        console.log("🔍 [TimeSlotSelector] Restaurant ouvert:", open);
        setIsOpen(open);
        
        // Récupérer tous les horaires d'ouverture
        const weekHours = await getWeekOpeningHours(cartRestaurant.id);
        console.log("🔍 [TimeSlotSelector] Horaires semaine:", weekHours);
        
        if (weekHours.length > 0) {
          const today = new Date();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const currentDay = days[today.getDay()];
          
          console.log("🔍 [TimeSlotSelector] Jour actuel:", currentDay, today.getDay());
          
          const todayHours = weekHours.filter(day => day.day === currentDay);
          console.log("🔍 [TimeSlotSelector] Horaires du jour trouvées:", todayHours);
          
          if (todayHours.length > 0) {
            const formattedHours = todayHours.map(hour => ({
              is_open: hour.is_open,
              open_time: hour.open_time,
              close_time: hour.close_time,
              slot_number: hour.slot_number || 1
            }));
            setTodayOpeningHours(formattedHours);
            console.log("✅ [TimeSlotSelector] Horaires configurées:", formattedHours);
          } else {
            // Si aucune donnée n'est trouvée pour ce jour, marquer comme fermé
            console.log("⚠️ [TimeSlotSelector] Aucune donnée pour ce jour, considéré comme fermé");
            setTodayOpeningHours([{
              is_open: false,
              open_time: "11:00",
              close_time: "22:00",
              slot_number: 1
            }]);
          }
        } else {
          console.log("⚠️ [TimeSlotSelector] Aucune donnée d'horaires, utilisation par défaut");
          setTodayOpeningHours([{
            is_open: true,
            open_time: "11:00",
            close_time: "22:00",
            slot_number: 1
          }]);
        }
      } catch (error) {
        console.error("❌ [TimeSlotSelector] Erreur lors de la vérification:", error);
        // En cas d'erreur, utiliser des horaires par défaut pour ne pas bloquer l'utilisateur
        setTodayOpeningHours([{
          is_open: true,
          open_time: "11:00",
          close_time: "22:00",
          slot_number: 1
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOpeningStatus();
  }, [cartRestaurant]);

  useEffect(() => {
    if (!isLoading && todayOpeningHours && cartRestaurant) {
      console.log("🔍 [TimeSlotSelector] Génération créneaux avec:", todayOpeningHours);
      generateTimeSlots();
    }
  }, [orderType, isLoading, todayOpeningHours, cartRestaurant]);

  // 🔄 ACTUALISATION AUTOMATIQUE toutes les 30 secondes pour éviter les doublons
  useEffect(() => {
    if (!isLoading && todayOpeningHours && cartRestaurant) {
      const interval = setInterval(() => {
        console.log("🔄 Actualisation automatique des créneaux...");
        generateTimeSlots();
      }, 30000); // 30 secondes

      return () => clearInterval(interval);
    }
  }, [isLoading, todayOpeningHours, cartRestaurant]);

  const getSlotDataBatch = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const todayString = today.toISOString().split('T')[0];
      
      // Récupérer toutes les commandes du jour en une seule requête
      const ordersPromise = supabase
        .from('orders')
        .select('scheduled_for, order_type, payment_status')
        .gte('scheduled_for', startOfDay.toISOString())
        .lt('scheduled_for', endOfDay.toISOString())
        .eq('restaurant_id', cartRestaurant?.id)
        .in('payment_status', ['paid', 'pending']); // Inclure paid ET pending

      // Récupérer tous les créneaux bloqués du jour en une seule requête
      const blockedSlotsPromise = supabase
        .from('blocked_time_slots')
        .select('blocked_time, blocked_service_type')
        .eq('restaurant_id', cartRestaurant?.id)
        .eq('blocked_date', todayString);

      const [ordersResult, blockedResult] = await Promise.all([ordersPromise, blockedSlotsPromise]);

      if (ordersResult.error) {
        console.error('❌ [TimeSlotSelector] Erreur récupération commandes:', ordersResult.error);
      }
      if (blockedResult.error) {
        console.error('❌ [TimeSlotSelector] Erreur récupération créneaux bloqués:', blockedResult.error);
      }

      // Compter les commandes par créneau selon le type
      const orderCounts: Record<string, number> = {};
      const deliveryCounts: Record<string, number> = {};
      const pickupCounts: Record<string, number> = {};
      
      (ordersResult.data || []).forEach((order: any) => {
        // Ne compter que les commandes payées ou en attente
        if (order.scheduled_for && (order.payment_status === 'paid' || order.payment_status === 'pending')) {
          // Extraire l'heure de scheduled_for
          const timeSlot = format(new Date(order.scheduled_for), 'HH:mm');
          
          // Compter toutes les commandes
          orderCounts[timeSlot] = (orderCounts[timeSlot] || 0) + 1;
          
          // Compter selon le type
          if (order.order_type === 'delivery') {
            deliveryCounts[timeSlot] = (deliveryCounts[timeSlot] || 0) + 1;
          } else {
            pickupCounts[timeSlot] = (pickupCounts[timeSlot] || 0) + 1;
          }
        }
      });

      console.log('📊 Compteurs créneaux livraison:', deliveryCounts);
      console.log('📊 Compteurs créneaux retrait:', pickupCounts);

      // Créer un Set des créneaux bloqués pour une recherche rapide selon le type de service
      const blockedSlots = new Set<string>();
      
      (blockedResult.data || []).forEach((slot: any) => {
        const timeSlot = slot.blocked_time.slice(0, 5); // "18:00:00" -> "18:00"
        const serviceType = slot.blocked_service_type;
        
        // Ajouter le créneau aux bloqués selon le type de service
        if (serviceType === 'both' || 
            (serviceType === 'delivery' && orderType === 'delivery') ||
            (serviceType === 'pickup' && orderType === 'pickup')) {
          blockedSlots.add(timeSlot);
        }
      });

      console.log(`🚫 Créneaux bloqués pour ${orderType}:`, Array.from(blockedSlots));

      return { orderCounts, deliveryCounts, pickupCounts, blockedSlots };
    } catch (error) {
      console.error('❌ [TimeSlotSelector] Erreur récupération données:', error);
      return { orderCounts: {}, deliveryCounts: {}, pickupCounts: {}, blockedSlots: new Set() };
    }
  };

  const generateTimeSlots = async () => {
    if (!todayOpeningHours || todayOpeningHours.length === 0) {
      console.log("⚠️ [TimeSlotSelector] Pas d'horaires disponibles");
      return;
    }
    
    const now = new Date();
    const slots: TimeOption[] = [];
    
    // Filtrer seulement les créneaux ouverts
    const openSlots = todayOpeningHours.filter(slot => slot.is_open);

    console.log("🔍 [TimeSlotSelector] Créneaux ouverts trouvés:", openSlots.length);

    // Si aucun créneau n'est ouvert aujourd'hui
    if (openSlots.length === 0) {
      console.log("❌ [TimeSlotSelector] Restaurant fermé aujourd'hui");
      setTimeSlots([]);
      return;
    }

    // Récupérer toutes les données en une seule fois
    const { orderCounts, deliveryCounts, pickupCounts, blockedSlots } = await getSlotDataBatch();

    // Générer des créneaux pour chaque slot d'ouverture
    for (const timeSlot of openSlots) {
      console.log("🔍 [TimeSlotSelector] Traitement du créneau:", timeSlot);
      
      const openTimeParts = timeSlot.open_time.split(':');
      const openHour = parseInt(openTimeParts[0], 10);
      const openMinute = parseInt(openTimeParts[1], 10);
      
      const closeTimeParts = timeSlot.close_time.split(':');
      const closeHour = parseInt(closeTimeParts[0], 10);
      const closeMinute = parseInt(closeTimeParts[1], 10);

      const startDate = new Date();
      startDate.setHours(openHour, openMinute, 0, 0);
      
      // Ajouter 30 minutes après l'heure d'ouverture pour le premier créneau disponible
      const adjustedStartDate = addMinutes(startDate, 30);

      const endDate = new Date();
      endDate.setHours(closeHour, closeMinute, 0, 0);

      console.log("🔍 [TimeSlotSelector] Créneau horaire:", {
        originalOpenTime: startDate.toLocaleTimeString(),
        adjustedStartTime: adjustedStartDate.toLocaleTimeString(),
        endDate: endDate.toLocaleTimeString(),
        slotNumber: timeSlot.slot_number
      });

      // Ajuster pour le délai de livraison ou de retrait
      const interval = 15; // 15 minutes pour tous les types
      
      // NOUVELLE LOGIQUE: Permettre les commandes toute la journée sur les créneaux d'ouverture
      // Au lieu de calculer un délai basé sur l'heure actuelle, on utilise directement l'heure d'ouverture
      let finalMinTime = new Date(adjustedStartDate);
      
      // Seule restriction: si on est déjà dans les 30 dernières minutes avant la fermeture,
      // on applique un délai minimum pour s'assurer que la commande peut être préparée
      const closingTime = new Date(endDate);
      const timeUntilClosing = closingTime.getTime() - now.getTime();
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes en millisecondes
      
      if (timeUntilClosing < thirtyMinutes) {
        // Si on est dans les 30 dernières minutes, appliquer un délai minimum
        const delayMinutes = 30;
        const minTime = addMinutes(now, delayMinutes);
        
        // Arrondir au prochain créneau de 15 minutes
        const minutes = minTime.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 15) * 15;
        const calculatedMinTime = new Date(minTime);
        
        if (roundedMinutes >= 60) {
          calculatedMinTime.setHours(minTime.getHours() + 1, roundedMinutes - 60, 0, 0);
        } else {
          calculatedMinTime.setMinutes(roundedMinutes, 0, 0);
        }
        
        // Utiliser le maximum entre l'heure d'ouverture ajustée et le délai minimum
        finalMinTime = new Date(Math.max(adjustedStartDate.getTime(), calculatedMinTime.getTime()));
        
        console.log(`🕐 [TimeSlotSelector] Délai appliqué (fin de journée) - Commande à ${format(now, 'HH:mm')} → Premier créneau ${format(finalMinTime, 'HH:mm')}`);
      } else {
        console.log(`🕐 [TimeSlotSelector] Commande libre - Tous les créneaux d'ouverture disponibles à partir de ${format(adjustedStartDate, 'HH:mm')}`);
      }

      let currentTime = new Date(finalMinTime);

      while (currentTime <= endDate) {
        const timeValue = format(currentTime, "HH:mm");
        // Vérifier si le créneau est dans le passé
        // Un créneau est considéré comme passé s'il est antérieur à l'heure actuelle + délai minimum
        const currentTimeWithDelay = addMinutes(now, 30); // Délai minimum de 30 minutes
        const isPassedTime = isAfter(currentTimeWithDelay, currentTime);
        
        // Vérifier la capacité du créneau selon le type de commande
        const currentOrders = orderCounts[timeValue] || 0;
        const currentDeliveries = deliveryCounts[timeValue] || 0;
        const currentPickups = pickupCounts[timeValue] || 0;
        
        
        let isSlotFull = false;
        if (orderType === "delivery") {
          // 🚨 LIMITE STRICTE: 1 livraison maximum par créneau par restaurant
          isSlotFull = currentDeliveries >= 1;
          
          if (isSlotFull) {
            console.log(`🚫 CRÉNEAU LIVRAISON BLOQUÉ: ${timeValue} (${currentDeliveries} livraison(s) déjà programmée(s)) - Restaurant: ${cartRestaurant?.name}`);
          } else {
            console.log(`✅ LIVRAISON DISPONIBLE: ${timeValue} (${currentDeliveries}/1) - Restaurant: ${cartRestaurant?.name}`);
          }
        } else {
          // Pour un retrait : limitation à 2 retraits par créneau
          const currentPickups = pickupCounts[timeValue] || 0;
          isSlotFull = currentPickups >= 2;
          
          if (isSlotFull) {
            console.log(`🚫 CRÉNEAU RETRAIT BLOQUÉ: ${timeValue} (${currentPickups} retrait(s) déjà programmé(s)) - Restaurant: ${cartRestaurant?.name}`);
          } else {
            console.log(`✅ RETRAIT DISPONIBLE: ${timeValue} (${currentPickups}/2) - Restaurant: ${cartRestaurant?.name}`);
          }
        }

        // Vérifier si le créneau est bloqué par l'admin
        const isSlotBlocked = blockedSlots.has(timeValue);

        slots.push({
          label: format(currentTime, "HH'h'mm", { locale: fr }),
          value: timeValue,
          disabled: isPassedTime || isSlotFull || isSlotBlocked,
        });

        currentTime = addMinutes(currentTime, interval);
      }
    }

    // Trier les créneaux par heure
    slots.sort((a, b) => a.value.localeCompare(b.value));

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
  if (!todayOpeningHours || todayOpeningHours.length === 0 || !todayOpeningHours.some(slot => slot.is_open)) {
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
