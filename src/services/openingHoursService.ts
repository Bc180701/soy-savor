import { supabase } from "@/integrations/supabase/client";

export interface DayOpeningHours {
  day: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  day_order: number;
}

export interface RestaurantOpeningHours {
  id: string;
  restaurant_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantClosure {
  id: string;
  restaurant_id: string;
  closure_date: string;
  reason?: string;
  is_all_day: boolean;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

// Vérifier si le restaurant est ouvert maintenant
export const isRestaurantOpenNow = async (restaurantId: string): Promise<boolean> => {
  try {
    console.log("🔍 [DEBUG] Vérification ouverture pour restaurant:", restaurantId);
    const now = new Date();
    const currentDay = now.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0]; // Format YYYY-MM-DD

    console.log("🔍 [DEBUG] Date/Heure actuelle:", {
      currentDay,
      currentTime,
      currentDate,
      dayName: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][currentDay]
    });

    // Vérifier d'abord les fermetures temporaires POUR CE RESTAURANT SPÉCIFIQUE
    console.log("🔍 [DEBUG] Vérification fermetures temporaires pour:", restaurantId);
    const { data: closures, error: closureError } = await supabase
      .from('restaurant_closures')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('closure_date', currentDate);

    if (closureError) {
      console.error("❌ [ERROR] Erreur lors de la vérification des fermetures:", closureError);
    } else {
      console.log("🔍 [DEBUG] Fermetures trouvées:", closures?.length || 0);
    }

    // Si il y a une fermeture pour aujourd'hui POUR CE RESTAURANT
    if (closures && closures.length > 0) {
      for (const closure of closures) {
        console.log("🔍 [DEBUG] Fermeture détectée:", closure);
        if (closure.is_all_day) {
          console.log("❌ [RESULT] Restaurant fermé toute la journée");
          return false;
        }
        
        // Vérifier si l'heure actuelle est dans la plage de fermeture
        if (closure.start_time && closure.end_time) {
          if (currentTime >= closure.start_time && currentTime <= closure.end_time) {
            console.log("❌ [RESULT] Restaurant fermé pendant cette plage horaire");
            return false;
          }
        }
      }
    }

    // Vérifier les horaires d'ouverture normaux POUR CE RESTAURANT
    console.log("🔍 [DEBUG] Vérification horaires normaux - jour:", currentDay);
    const { data: openingHours, error } = await supabase
      .from('restaurant_opening_hours')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('day_of_week', currentDay);

    console.log("🔍 [DEBUG] Réponse horaires d'ouverture:", { openingHours, error });

    if (error) {
      console.error("❌ [ERROR] Erreur lors de la récupération des horaires:", error);
      console.log("⚠️ [FALLBACK] Pas d'horaires trouvés, considéré comme ouvert par défaut");
      return true;
    }

    if (!openingHours || openingHours.length === 0) {
      console.log("⚠️ [FALLBACK] Aucune donnée d'horaires trouvée, considéré comme ouvert");
      return true;
    }

    const todayHours = openingHours[0];
    console.log("🔍 [DEBUG] Horaires du jour:", todayHours);

    if (!todayHours.is_open) {
      console.log("❌ [RESULT] Restaurant fermé selon horaires configurés");
      return false;
    }

    // Nettoyer les heures pour éviter les erreurs de format
    const openTime = todayHours.open_time;
    const closeTime = todayHours.close_time;
    
    console.log("🔍 [DEBUG] Comparaison horaires:", {
      currentTime,
      openTime,
      closeTime
    });

    if (!openTime || !closeTime) {
      console.log("⚠️ [FALLBACK] Horaires non définis, considéré comme ouvert");
      return true;
    }

    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    console.log(`✅ [RESULT] Restaurant ${isOpen ? 'OUVERT' : 'FERMÉ'}`);
    
    return isOpen;
  } catch (error) {
    console.error("❌ [EXCEPTION] Exception lors de la vérification des horaires:", error);
    console.log("⚠️ [FALLBACK] Erreur, considéré comme ouvert par défaut");
    return true;
  }
};

// Récupérer les horaires de la semaine pour un restaurant
export const getWeekOpeningHours = async (restaurantId: string): Promise<DayOpeningHours[]> => {
  try {
    console.log("🔍 [DEBUG] Récupération horaires semaine pour:", restaurantId);
    const { data: openingHours, error } = await supabase
      .from('restaurant_opening_hours')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('day_of_week');

    if (error) {
      console.error("❌ [ERROR] Erreur lors de la récupération des horaires:", error);
      return getDefaultOpeningHours();
    }

    if (!openingHours || openingHours.length === 0) {
      console.log("⚠️ [FALLBACK] Aucune donnée d'horaires trouvée, utilisation d'horaires par défaut");
      return getDefaultOpeningHours();
    }

    console.log("✅ [SUCCESS] Horaires récupérés:", openingHours);

    // Convertir les données de la base vers le format attendu
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    return openingHours.map(hour => ({
      day: dayNames[hour.day_of_week],
      is_open: hour.is_open,
      open_time: hour.open_time,
      close_time: hour.close_time,
      day_order: hour.day_of_week
    }));
  } catch (error) {
    console.error("❌ [EXCEPTION] Exception lors de la récupération des horaires:", error);
    return getDefaultOpeningHours();
  }
};

// Récupérer le prochain jour d'ouverture
export const getNextOpenDay = async (restaurantId: string): Promise<DayOpeningHours | null> => {
  try {
    const now = new Date();
    const currentDayIndex = now.getDay();
    
    const { data: openingHours, error } = await supabase
      .from('restaurant_opening_hours')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_open', true)
      .order('day_of_week');

    if (error || !openingHours || openingHours.length === 0) {
      console.log("Aucune donnée d'horaires trouvée pour le prochain jour ouvert");
      return {
        day: "tuesday",
        is_open: true,
        open_time: "11:00",
        close_time: "22:00",
        day_order: 2
      };
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Chercher le prochain jour ouvert
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextOpenDay = openingHours.find(day => day.day_of_week === nextDayIndex);
      
      if (nextOpenDay) {
        return {
          day: dayNames[nextOpenDay.day_of_week],
          is_open: nextOpenDay.is_open,
          open_time: nextOpenDay.open_time,
          close_time: nextOpenDay.close_time,
          day_order: nextOpenDay.day_of_week
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Exception lors de la récupération du prochain jour ouvert:", error);
    return {
      day: "tuesday",
      is_open: true,
      open_time: "11:00",
      close_time: "22:00",
      day_order: 2
    };
  }
};

// Sauvegarder les horaires d'ouverture pour un restaurant
export const saveRestaurantOpeningHours = async (restaurantId: string, hours: DayOpeningHours[]): Promise<boolean> => {
  try {
    console.log("📝 [DEBUG] Sauvegarde des horaires pour le restaurant:", restaurantId);
    
    const dayMap: { [key: string]: number } = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };

    // Supprimer les horaires existants pour ce restaurant
    const { error: deleteError } = await supabase
      .from('restaurant_opening_hours')
      .delete()
      .eq('restaurant_id', restaurantId);

    if (deleteError) {
      console.error("❌ [ERROR] Erreur lors de la suppression des horaires existants:", deleteError);
      throw deleteError;
    }

    // Insérer les nouveaux horaires avec validation
    const hoursToInsert = hours.map(hour => {
      // Validation des heures
      const openTime = hour.open_time || "11:00";
      const closeTime = hour.close_time || "22:00";
      
      return {
        restaurant_id: restaurantId,
        day_of_week: dayMap[hour.day],
        is_open: hour.is_open,
        open_time: openTime,
        close_time: closeTime
      };
    });

    console.log("📝 [DEBUG] Données à insérer:", hoursToInsert);

    const { error: insertError } = await supabase
      .from('restaurant_opening_hours')
      .insert(hoursToInsert);

    if (insertError) {
      console.error("❌ [ERROR] Erreur lors de l'insertion des nouveaux horaires:", insertError);
      throw insertError;
    }

    console.log("✅ [SUCCESS] Horaires sauvegardés avec succès");
    return true;
  } catch (error) {
    console.error("❌ [EXCEPTION] Exception lors de la sauvegarde des horaires:", error);
    return false;
  }
};

// Fonction utilitaire pour les horaires par défaut
const getDefaultOpeningHours = (): DayOpeningHours[] => {
  return [
    { day: "sunday", is_open: false, open_time: "11:00", close_time: "22:00", day_order: 0 },
    { day: "monday", is_open: false, open_time: "11:00", close_time: "22:00", day_order: 1 },
    { day: "tuesday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 2 },
    { day: "wednesday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 3 },
    { day: "thursday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 4 },
    { day: "friday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 5 },
    { day: "saturday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 6 }
  ];
};

// Gérer les fermetures temporaires
export const addRestaurantClosure = async (restaurantId: string, closure: {
  closure_date: string;
  reason?: string;
  is_all_day: boolean;
  start_time?: string;
  end_time?: string;
}): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('restaurant_closures')
      .insert({
        restaurant_id: restaurantId,
        ...closure
      });

    if (error) {
      console.error("Erreur lors de l'ajout de la fermeture:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception lors de l'ajout de la fermeture:", error);
    return false;
  }
};

export const getRestaurantClosures = async (restaurantId: string): Promise<RestaurantClosure[]> => {
  try {
    const { data, error } = await supabase
      .from('restaurant_closures')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('closure_date');

    if (error) {
      console.error("Erreur lors de la récupération des fermetures:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception lors de la récupération des fermetures:", error);
    return [];
  }
};

export const deleteRestaurantClosure = async (closureId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('restaurant_closures')
      .delete()
      .eq('id', closureId);

    if (error) {
      console.error("Erreur lors de la suppression de la fermeture:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception lors de la suppression de la fermeture:", error);
    return false;
  }
};
