
import { supabase } from "@/integrations/supabase/client";

export interface DayOpeningHours {
  day: string;
  day_order: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export const openingHoursService = {
  async getOpeningHours(): Promise<DayOpeningHours[]> {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('section_data')
        .eq('section_name', 'opening_hours')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.section_data) {
        return data.section_data as DayOpeningHours[];
      }
      
      // Valeurs par défaut si aucune donnée n'existe
      return [
        { day: "monday", day_order: 0, is_open: false, open_time: "11:00", close_time: "22:00" },
        { day: "tuesday", day_order: 1, is_open: true, open_time: "11:00", close_time: "22:00" },
        { day: "wednesday", day_order: 2, is_open: true, open_time: "11:00", close_time: "22:00" },
        { day: "thursday", day_order: 3, is_open: true, open_time: "11:00", close_time: "22:00" },
        { day: "friday", day_order: 4, is_open: true, open_time: "11:00", close_time: "22:00" },
        { day: "saturday", day_order: 5, is_open: true, open_time: "11:00", close_time: "22:00" },
        { day: "sunday", day_order: 6, is_open: false, open_time: "11:00", close_time: "22:00" }
      ];
    } catch (error) {
      console.error("Error fetching opening hours:", error);
      throw error;
    }
  },

  async isRestaurantOpen(): Promise<boolean> {
    try {
      const openingHours = await this.getOpeningHours();
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const currentTime = now.toTimeString().slice(0, 5); // Format HH:MM
      
      const todayHours = openingHours.find(hours => hours.day === currentDay);
      
      if (!todayHours || !todayHours.is_open) {
        return false;
      }
      
      return currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
    } catch (error) {
      console.error("Error checking if restaurant is open:", error);
      return true; // En cas d'erreur, considérer comme ouvert
    }
  },

  async getTodayHours(): Promise<string> {
    try {
      const openingHours = await this.getOpeningHours();
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      
      const todayHours = openingHours.find(hours => hours.day === currentDay);
      
      if (!todayHours || !todayHours.is_open) {
        return "Fermé aujourd'hui";
      }
      
      return `${todayHours.open_time} - ${todayHours.close_time}`;
    } catch (error) {
      console.error("Error getting today's hours:", error);
      return "Horaires non disponibles";
    }
  }
};
