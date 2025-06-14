
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeroSection {
  title: string;
  subtitle: string;
  image_url?: string;
  overlay_image?: string;
  background_image: string;
}

export interface CustomCreationSection {
  title: string;
  description?: string;
  subtitle: string;
  image_url?: string;
  background_image: string;
  sushi_image: string;
  poke_image: string;
  sushi_button_text: string;
  sushi_button_link: string;
  poke_button_text: string;
  poke_button_link: string;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  image_url?: string;
  link?: string;
  isActive?: boolean;
}

export interface GoogleReviewsSection {
  title: string;
  description: string;
  google_business_profile_link?: string;
  google_business_url: string;
  number_of_reviews?: number;
  total_reviews: number;
  average_rating: number;
  button_text: string;
  review_button_text: string;
}

export interface DeliveryMapSection {
  title: string;
  subtitle: string;
  restaurant_info: {
    name: string;
    address: string;
    subtitle: string;
  };
  no_zones_message: string;
}

export interface OrderOption {
  title: string;
  description: string;
  image_url?: string;
  link?: string;
  icon: string;
}

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
}

export interface HeaderSection {
  logo_alt: string;
  nav_links: {
    home: string;
    menu: string;
    order: string;
    contact: string;
  };
  buttons: {
    login: string;
    order: string;
  };
}

export interface FooterSection {
  company_description: string;
  navigation_title: string;
  hours_title: string;
  contact_title: string;
  opening_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  copyright_text: string;
  legal_links: {
    mentions_legales: string;
    cgv: string;
    confidentialite: string;
  };
  social_links: {
    facebook_aria: string;
    instagram_aria: string;
    linkedin_aria: string;
  };
}

export interface HomepageData {
  hero_section: HeroSection;
  custom_creation_section: CustomCreationSection;
  promotions: Promotion[];
  google_reviews_section: GoogleReviewsSection;
  delivery_zones: string[];
  delivery_map_section: DeliveryMapSection;
  order_options: OrderOption[];
  contact_info: ContactInfo;
  header_section: HeaderSection;
  footer_section: FooterSection;
}

interface UseHomepageDataResult {
  data: HomepageData;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useHomepageData = (): UseHomepageDataResult => {
  const [data, setData] = useState<HomepageData>({
    hero_section: {
      title: "SushiEats",
      subtitle: "Les meilleurs sushis de Châteaurenard",
      background_image: "/placeholder-hero.webp",
      overlay_image: "/map-overlay.svg",
    },
    custom_creation_section: {
      title: "Créez votre propre sushi ou poké",
      description: "Laissez libre cours à votre imagination et créez le sushi ou le poké parfait.",
      subtitle: "Laissez libre cours à votre créativité avec nos options de personnalisation",
      background_image: "",
      sushi_image: "",
      poke_image: "",
      sushi_button_text: "Créer mes sushis",
      sushi_button_link: "/composer-sushi",
      poke_button_text: "Créer mon poké",
      poke_button_link: "/composer-poke"
    },
    promotions: [],
    google_reviews_section: {
      title: "Nos avis Google",
      description: "Découvrez ce que nos clients pensent de notre restaurant",
      google_business_url: "https://www.google.com/maps/place/SushiEats/@43.8828,4.8535,15z",
      total_reviews: 150,
      average_rating: 4.8,
      button_text: "Voir tous nos avis Google",
      review_button_text: "Laisser un avis"
    },
    delivery_zones: [],
    delivery_map_section: {
      title: "Zones de livraison",
      subtitle: "Nous livrons dans les communes suivantes autour de Châteaurenard. Commandez en ligne et recevez vos sushis directement chez vous !",
      restaurant_info: {
        name: "SushiEats Châteaurenard",
        address: "16 cours Carnot, 13160 Châteaurenard",
        subtitle: "Point de départ des livraisons",
      },
      no_zones_message: "Aucune zone de livraison n'est actuellement définie.",
    },
    order_options: [],
    contact_info: {
      address: "16 cours Carnot, 13160 Châteaurenard",
      phone: "04 90 00 00 00",
      email: "contact@sushieats.fr",
    },
    header_section: {
      logo_alt: "SushiEats Logo",
      nav_links: {
        home: "Accueil",
        menu: "Menu",
        order: "Commander",
        contact: "Contact",
      },
      buttons: {
        login: "Se connecter",
        order: "Commander",
      },
    },
    footer_section: {
      company_description:
        "Découvrez l'art du sushi à Châteaurenard. Des produits frais préparés avec soin pour une expérience gourmande unique.",
      navigation_title: "Navigation",
      hours_title: "Horaires d'ouverture",
      contact_title: "Contact",
      opening_hours: {
        monday: "Fermé",
        tuesday: "11:00–14:00, 18:00–22:00",
        wednesday: "11:00–14:00, 18:00–22:00",
        thursday: "11:00–14:00, 18:00–22:00",
        friday: "11:00–14:00, 18:00–22:00",
        saturday: "11:00–14:00, 18:00–22:00",
        sunday: "Fermé",
      },
      copyright_text: "SushiEats. Tous droits réservés.",
      legal_links: {
        mentions_legales: "Mentions légales",
        cgv: "CGV",
        confidentialite: "Politique de confidentialité",
      },
      social_links: {
        facebook_aria: "Facebook",
        instagram_aria: "Instagram",
        linkedin_aria: "LinkedIn",
      },
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sections, error: sectionsError } = await supabase
        .from('homepage_sections')
        .select('section_name, section_data');

      if (sectionsError) {
        throw new Error(sectionsError.message);
      }

      if (sections) {
        const homepageData: HomepageData = {
          hero_section: data.hero_section,
          custom_creation_section: data.custom_creation_section,
          promotions: data.promotions,
          google_reviews_section: data.google_reviews_section,
          delivery_zones: data.delivery_zones,
          delivery_map_section: data.delivery_map_section,
          order_options: data.order_options,
          contact_info: data.contact_info,
          header_section: data.header_section,
          footer_section: data.footer_section,
        };

        sections.forEach((section) => {
          if (section.section_name === 'hero_section') {
            homepageData.hero_section = section.section_data as unknown as HeroSection;
          } else if (section.section_name === 'custom_creation_section') {
            homepageData.custom_creation_section = section.section_data as unknown as CustomCreationSection;
          } else if (section.section_name === 'promotions') {
            homepageData.promotions = section.section_data as unknown as Promotion[];
          } else if (section.section_name === 'google_reviews_section') {
            homepageData.google_reviews_section = section.section_data as unknown as GoogleReviewsSection;
          } else if (section.section_name === 'delivery_zones') {
            homepageData.delivery_zones = section.section_data as unknown as string[];
          } else if (section.section_name === 'delivery_map_section') {
            homepageData.delivery_map_section = section.section_data as unknown as DeliveryMapSection;
          } else if (section.section_name === 'order_options') {
            homepageData.order_options = section.section_data as unknown as OrderOption[];
          } else if (section.section_name === 'contact_info') {
            homepageData.contact_info = section.section_data as unknown as ContactInfo;
          } else if (section.section_name === 'header_section') {
            homepageData.header_section = section.section_data as unknown as HeaderSection;
          } else if (section.section_name === 'footer_section') {
            homepageData.footer_section = section.section_data as unknown as FooterSection;
          }
        });

        setData(homepageData);
      }
    } catch (err: any) {
      setError(new Error(err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = async () => {
    await fetchData();
  };

  return { data, loading, error, refetch };
};
