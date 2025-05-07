
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

// Default data to use as fallback
const DEFAULT_HOMEPAGE_DATA: HomepageData = {
  hero_section: {
    background_image: "/lovable-uploads/b09ca63a-4c04-46fa-9754-c3486bc3dca3.png",
    title: "L'art du sushi à <span class=\"text-gold-500\">Châteaurenard</span>",
    subtitle: "Des produits frais, des saveurs authentiques, une expérience japonaise unique à déguster sur place ou à emporter."
  },
  promotions: [
    {
      id: 1,
      title: "Box du Midi à -20%",
      description: "Du mardi au vendredi, profitez de -20% sur nos box du midi !",
      imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop",
      buttonText: "En profiter",
      buttonLink: "/menu",
    },
    {
      id: 2,
      title: "1 Plateau Acheté = 1 Dessert Offert",
      description: "Pour toute commande d'un plateau, recevez un dessert au choix offert !",
      imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
      buttonText: "Découvrir",
      buttonLink: "/menu",
    },
    {
      id: 3,
      title: "10% sur votre première commande",
      description: "Utilisez le code BIENVENUE pour bénéficier de 10% sur votre première commande en ligne",
      imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1000&auto=format&fit=crop",
      buttonText: "Commander",
      buttonLink: "/commander",
    }
  ],
  delivery_zones: [
    "Châteaurenard", "Eyragues", "Barbentane", "Rognonas", 
    "Graveson", "Maillane", "Noves", "Cabanes", 
    "Avignon", "Saint-Rémy de Provence", "Boulbon"
  ],
  order_options: [
    {
      title: "Livraison",
      description: "Livraison à domicile dans notre zone de chalandise",
      icon: "Truck"
    },
    {
      title: "À emporter",
      description: "Commandez et récupérez en restaurant",
      icon: "ShoppingBag"
    },
    {
      title: "Sur place",
      description: "Profitez de votre repas dans notre restaurant",
      icon: "Users"
    }
  ]
};

export const useHomepageData = () => {
  const [data, setData] = useState<HomepageData>(DEFAULT_HOMEPAGE_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      console.log("Fetching homepage data from Supabase...");
      
      // Vérifie si la table homepage_sections existe
      // @ts-ignore - Type safety sera résolu quand les types Supabase seront régénérés
      const { data: tableExists, error: tableError } = await supabase.rpc('check_table_exists', {
        table_name: 'homepage_sections'
      }).single();
      
      if (tableError) {
        console.error("Error checking if table exists:", tableError);
        throw tableError;
      }
      
      console.log("Table homepage_sections exists:", tableExists);
      
      if (tableExists) {
        // Récupère les données en utilisant la fonction RPC
        console.log("Fetching homepage data using RPC function...");
        // @ts-ignore - Type safety sera résolu quand les types Supabase seront régénérés
        const { data: homepageData, error } = await supabase.rpc('get_homepage_data').single();
        
        if (error) {
          console.error("Error fetching homepage data:", error);
          throw error;
        }

        console.log("Homepage data received:", homepageData);

        if (homepageData) {
          // Cast les données JSON renvoyées avec une vérification de type
          const typedData = homepageData as Record<string, any>;
          
          // Ensure we have data for each section, using defaults if not provided
          const validatedData: HomepageData = {
            hero_section: typedData.hero_section || DEFAULT_HOMEPAGE_DATA.hero_section,
            promotions: typedData.promotions || DEFAULT_HOMEPAGE_DATA.promotions,
            delivery_zones: typedData.delivery_zones || DEFAULT_HOMEPAGE_DATA.delivery_zones,
            order_options: typedData.order_options || DEFAULT_HOMEPAGE_DATA.order_options
          };
          
          console.log("Setting validated homepage data:", validatedData);
          setData(validatedData);
        } else {
          console.log("No homepage data found, using default data");
          setData(DEFAULT_HOMEPAGE_DATA);
        }
      } else {
        console.log("Table doesn't exist, using default data");
        setData(DEFAULT_HOMEPAGE_DATA);
      }
    } catch (err) {
      console.error("Error in fetchHomepageData:", err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      // On utilise toujours les données par défaut en cas d'erreur
      setData(DEFAULT_HOMEPAGE_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepageData();
  }, []);

  return { data, loading, error, refetch: fetchHomepageData };
};
