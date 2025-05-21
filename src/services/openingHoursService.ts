
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
      .single();
    
    if (error || !data) {
      console.error("Error checking opening hours:", error);
      return false;
    }
    
    const openingHours = data.section_data as DayOpeningHours[];
    const todayHours = openingHours.find(day => day.day === currentDay);
    
    if (!todayHours || !todayHours.is_open) {
      return false;
    }
    
    return currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
  } catch (error) {
    console.error("Exception when checking opening hours:", error);
    return false;
  }
};

export const getWeekOpeningHours = async (): Promise<DayOpeningHours[]> => {
  try {
    const { data, error } = await supabase
      .from('homepage_sections')
      .select('section_data')
      .eq('section_name', 'opening_hours')
      .single();
    
    if (error) {
      console.error("Error fetching opening hours:", error);
      return [];
    }
    
    return (data?.section_data as DayOpeningHours[]) || [];
  } catch (error) {
    console.error("Exception when fetching opening hours:", error);
    return [];
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
      .single();
    
    if (error || !data) {
      console.error("Error fetching next open day:", error);
      return null;
    }
    
    const openingHours = data.section_data as DayOpeningHours[];
    
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
    return null;
  }
};
