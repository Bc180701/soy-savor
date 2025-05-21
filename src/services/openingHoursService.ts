
import { supabase } from "@/integrations/supabase/client";

export interface DayOpeningHours {
  day: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  day_order: number;
}

// Vérifier si le restaurant est ouvert maintenant
export const isRestaurantOpenNow = async (): Promise<boolean> => {
  try {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Récupérer les horaires d'ouverture pour le jour actuel
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('day', currentDay)
      .single();
    
    if (error || !data) {
      console.error("Erreur lors de la vérification des horaires d'ouverture:", error);
      return false;
    }
    
    // Si le restaurant est fermé ce jour-là
    if (!data.is_open) {
      return false;
    }
    
    // Vérifier si l'heure actuelle est dans la plage d'ouverture
    return currentTime >= data.open_time && currentTime <= data.close_time;
  } catch (error) {
    console.error("Exception lors de la vérification des horaires d'ouverture:", error);
    return false;
  }
};

// Obtenir les horaires d'ouverture pour tous les jours
export const getWeekOpeningHours = async (): Promise<DayOpeningHours[]> => {
  try {
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .order('day_order');
    
    if (error) {
      console.error("Erreur lors de la récupération des horaires d'ouverture:", error);
      return [];
    }
    
    return data as DayOpeningHours[];
  } catch (error) {
    console.error("Exception lors de la récupération des horaires d'ouverture:", error);
    return [];
  }
};

// Obtenir le jour d'ouverture suivant
export const getNextOpenDay = async (): Promise<DayOpeningHours | null> => {
  try {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayIndex = now.getDay();
    
    // Récupérer tous les jours d'ouverture
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('is_open', true)
      .order('day_order');
    
    if (error || !data || data.length === 0) {
      console.error("Erreur lors de la récupération des jours d'ouverture:", error);
      return null;
    }
    
    // Chercher le prochain jour ouvert
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = days[nextDayIndex];
      
      const nextOpenDay = data.find(day => day.day === nextDay);
      if (nextOpenDay) {
        return nextOpenDay as DayOpeningHours;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Exception lors de la récupération du prochain jour d'ouverture:", error);
    return null;
  }
};
