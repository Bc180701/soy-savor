
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
    console.log("🔍 Vérification ouverture pour restaurant:", restaurantId);
    const now = new Date();
    const currentDay = now.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0]; // Format YYYY-MM-DD

    // Vérifier d'abord les fermetures temporaires POUR CE RESTAURANT SPÉCIFIQUE
    console.log("🔍 Vérification fermetures temporaires pour:", restaurantId, "date:", currentDate);
    const { data: closures, error: closureError } = await supabase
      .from('restaurant_closures')
      .select('*')
      .eq('restaurant_id', restaurantId)  // FILTRE IMPORTANT : par restaurant
      .eq('closure_date', currentDate);

    if (closureError) {
      console.error("Erreur lors de la vérification des fermetures:", closureError);
    }

    console.log("🔍 Fermetures trouvées:", closures?.length || 0, "pour restaurant:", restaurantId);

    // Si il y a une fermeture pour aujourd'hui POUR CE RESTAURANT
    if (closures && closures.length > 0) {
      for (const closure of closures) {
        console.log("🔍 Fermeture trouvée:", closure);
        if (closure.is_all_day) {
          console.log("❌ Restaurant fermé toute la journée:", restaurantId);
          return false; // Fermé toute la journée
        }
        
        // Vérifier si l'heure actuelle est dans la plage de fermeture
        if (closure.start_time && closure.end_time) {
          if (currentTime >= closure.start_time && currentTime <= closure.end_time) {
            console.log("❌ Restaurant fermé pendant cette plage horaire:", restaurantId);
            return false; // Fermé pendant cette plage horaire
          }
        }
      }
    }

    // Vérifier les horaires d'ouverture normaux POUR CE RESTAURANT
    console.log("🔍 Vérification horaires normaux pour:", restaurantId, "jour:", currentDay);
    const { data: openingHours, error } = await supabase
      .from('restaurant_opening_hours')
      .select('*')
      .eq('restaurant_id', restaurantId)  // FILTRE IMPORTANT : par restaurant
      .eq('day_of_week', currentDay)
      .single();

    if (error || !openingHours) {
      console.log("⚠️ Aucune donnée d'horaires trouvée pour ce restaurant, considéré comme ouvert");
      return true;
    }

    if (!openingHours.is_open) {
      console.log("❌ Restaurant fermé selon horaires normaux:", restaurantId);
      return false;
    }

    const isOpen = currentTime >= openingHours.open_time && currentTime <= openingHours.close_time;
    console.log("✅ Restaurant", restaurantId, "ouvert:", isOpen, "heure actuelle:", currentTime, "horaires:", openingHours.open_time, "-", openingHours.close_time);
    
    return isOpen;
  } catch (error) {
    console.error("Exception lors de la vérification des horaires:", error);
    return true;
  }
};

// Récupérer les horaires de la semaine pour un restaurant
export const getWeekOpeningHours = async (restaurantId: string): Promise<DayOpeningHours[]> => {
  try {
    const { data: openingHours, error } = await supabase
      .from('restaurant_opening_hours')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('day_of_week');

    if (error) {
      console.error("Erreur lors de la récupération des horaires:", error);
      return getDefaultOpeningHours();
    }

    if (!openingHours || openingHours.length === 0) {
      console.log("Aucune donnée d'horaires trouvée, utilisation d'horaires par défaut");
      return getDefaultOpeningHours();
    }

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
    console.error("Exception lors de la récupération des horaires:", error);
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
    console.log("Sauvegarde des horaires pour le restaurant:", restaurantId);
    
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
      console.error("Erreur lors de la suppression des horaires existants:", deleteError);
      throw deleteError;
    }

    // Insérer les nouveaux horaires
    const hoursToInsert = hours.map(hour => ({
      restaurant_id: restaurantId,
      day_of_week: dayMap[hour.day],
      is_open: hour.is_open,
      open_time: hour.open_time,
      close_time: hour.close_time
    }));

    const { error: insertError } = await supabase
      .from('restaurant_opening_hours')
      .insert(hoursToInsert);

    if (insertError) {
      console.error("Erreur lors de l'insertion des nouveaux horaires:", insertError);
      throw insertError;
    }

    console.log("Horaires sauvegardés avec succès");
    return true;
  } catch (error) {
    console.error("Exception lors de la sauvegarde des horaires:", error);
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
