
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

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
      
      // Récupération directe des données de la table homepage_sections
      const { data: sections, error: sectionsError } = await supabase
        .from('homepage_sections')
        .select('*');
      
      if (sectionsError) {
        console.error("Error fetching homepage sections:", sectionsError);
        throw sectionsError;
      }
      
      console.log("Homepage sections received:", sections);
      
      if (sections && sections.length > 0) {
        // Transformer les sections en objet HomepageData
        const homepageData: Partial<HomepageData> = {};
        
        for (const section of sections) {
          if (section.section_name === 'hero_section') {
            // On force le typage ici en étant sûr que la structure est correcte
            homepageData.hero_section = section.section_data as unknown as HeroSection;
          } else if (section.section_name === 'promotions') {
            // On force le typage ici en étant sûr que la structure est correcte
            homepageData.promotions = section.section_data as unknown as Promotion[];
          } else if (section.section_name === 'delivery_zones') {
            // On force le typage ici en étant sûr que la structure est correcte
            homepageData.delivery_zones = section.section_data as unknown as string[];
          } else if (section.section_name === 'order_options') {
            // On force le typage ici en étant sûr que la structure est correcte
            homepageData.order_options = section.section_data as unknown as OrderOption[];
          }
        }
        
        // Fusionner avec les valeurs par défaut pour garantir les données complètes
        const validatedData: HomepageData = {
          hero_section: homepageData.hero_section || DEFAULT_HOMEPAGE_DATA.hero_section,
          promotions: homepageData.promotions || DEFAULT_HOMEPAGE_DATA.promotions,
          delivery_zones: homepageData.delivery_zones || DEFAULT_HOMEPAGE_DATA.delivery_zones,
          order_options: homepageData.order_options || DEFAULT_HOMEPAGE_DATA.order_options
        };
        
        console.log("Setting validated homepage data:", validatedData);
        setData(validatedData);
      } else {
        console.log("No homepage data found, using default data");
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
