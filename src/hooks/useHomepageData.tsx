
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface HeroSection {
  background_image: string;
  title: string;
  subtitle: string;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
}

export interface OrderOption {
  title: string;
  description: string;
  icon: string;
}

export interface HomepageData {
  id?: number;
  hero_section: HeroSection;
  promotions: Promotion[];
  delivery_zones: string[];
  order_options: OrderOption[];
}

export const useHomepageData = () => {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setData(data);
    } catch (err) {
      console.error("Error fetching homepage data:", err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageData();
  }, []);

  return { data, loading, error, refetch: fetchHomepageData };
};
