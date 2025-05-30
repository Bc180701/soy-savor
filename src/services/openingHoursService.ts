
import { supabase } from "@/integrations/supabase/client";

export interface DayOpeningHours {
  day: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  day_order: number;
}

// Store opening hours in the homepage_sections table
export const isRestaurantOpenNow = async (): Promise<boolean> => {
  try {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Get opening hours from homepage_sections table
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('section_data')
      .eq('section_name', 'opening_hours')
      .maybeSingle();
    
    if (error || !data) {
      console.log("Aucune donnée d'horaires trouvée, restaurant considéré comme ouvert");
      // Si pas de données d'horaires, considérer le restaurant comme ouvert par défaut
      return true;
    }
    
    // Cast the section_data to DayOpeningHours[] type with proper type checking
    const openingHours = data.section_data as unknown as DayOpeningHours[];
    const todayHours = openingHours.find(day => day.day === currentDay);
    
    if (!todayHours || !todayHours.is_open) {
      return false;
    }
    
    return currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
  } catch (error) {
    console.error("Exception when checking opening hours:", error);
    // En cas d'erreur, considérer le restaurant comme ouvert par défaut
    return true;
  }
};

export const getWeekOpeningHours = async (): Promise<DayOpeningHours[]> => {
  try {
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('section_data')
      .eq('section_name', 'opening_hours')
      .maybeSingle();
    
    if (error || !data) {
      console.log("Aucune donnée d'horaires trouvée, utilisation d'horaires par défaut");
      // Retourner des horaires par défaut si pas de données
      return [
        { day: "monday", is_open: false, open_time: "11:00", close_time: "22:00", day_order: 1 },
        { day: "tuesday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 2 },
        { day: "wednesday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 3 },
        { day: "thursday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 4 },
        { day: "friday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 5 },
        { day: "saturday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 6 },
        { day: "sunday", is_open: false, open_time: "11:00", close_time: "22:00", day_order: 0 }
      ];
    }
    
    // Use proper type casting to ensure TypeScript understands the data structure
    return (data?.section_data as unknown as DayOpeningHours[]) || [];
  } catch (error) {
    console.error("Exception when fetching opening hours:", error);
    // Retourner des horaires par défaut en cas d'erreur
    return [
      { day: "monday", is_open: false, open_time: "11:00", close_time: "22:00", day_order: 1 },
      { day: "tuesday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 2 },
      { day: "wednesday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 3 },
      { day: "thursday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 4 },
      { day: "friday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 5 },
      { day: "saturday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 6 },
      { day: "sunday", is_open: false, open_time: "11:00", close_time: "22:00", day_order: 0 }
    ];
  }
};

export const getNextOpenDay = async (): Promise<DayOpeningHours | null> => {
  try {
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayIndex = now.getDay();
    
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('section_data')
      .eq('section_name', 'opening_hours')
      .maybeSingle();
    
    if (error || !data) {
      console.log("Aucune donnée d'horaires trouvée pour le prochain jour ouvert");
      // Retourner mardi comme prochain jour ouvert par défaut
      return { day: "tuesday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 2 };
    }
    
    // Cast the section_data to DayOpeningHours[] with proper type checking
    const openingHours = data.section_data as unknown as DayOpeningHours[];
    
    // Find the next open day
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = days[nextDayIndex];
      
      const nextOpenDay = openingHours.find(day => day.day === nextDay && day.is_open);
      if (nextOpenDay) {
        return nextOpenDay;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Exception when fetching next open day:", error);
    // Retourner mardi comme prochain jour ouvert par défaut en cas d'erreur
    return { day: "tuesday", is_open: true, open_time: "11:00", close_time: "22:00", day_order: 2 };
  }
};
