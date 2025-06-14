import { useEffect, useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { OrderCTA } from "@/components/OrderCTA";
import { DeliveryMap } from "@/components/DeliveryMap";
import { PromotionCard } from "@/components/PromotionCard";
import { CustomCreationSection } from "@/components/CustomCreationSection";
import FeaturedProductsSection from "@/components/FeaturedProductsSection";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import { useHomepageData, HomepageData } from "@/hooks/useHomepageData";
import { usePromotions } from "@/hooks/usePromotions";
import { supabase } from "@/integrations/supabase/client";

// Default data to use as fallback
const DEFAULT_HOMEPAGE_DATA: HomepageData = {
  hero_section: {
    background_image: "/lovable-uploads/b09ca63a-4c04-46fa-9754-c3486bc3dca3.png",
    title: "L'art du sushi à <span class=\"text-gold-500\">Châteaurenard</span>",
    subtitle: "Des produits frais, des saveurs authentiques, une expérience japonaise unique à déguster sur place ou à emporter."
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
  promotions: [
    {
      id: 1,
      title: "Box du Midi à -20%",
      description: "Du mardi au vendredi, profitez de -20% sur nos box du midi !",
      imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop",
      buttonText: "En profiter",
      buttonLink: "/commander",
    },
    {
      id: 2,
      title: "1 Plateau Acheté = 1 Dessert Offert",
      description: "Pour toute commande d'un plateau, recevez un dessert au choix offert !",
      imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
      buttonText: "Découvrir",
      buttonLink: "/commander",
      isActive: true,
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
  google_reviews_section: {
    title: "Nos avis Google",
    description: "Découvrez ce que nos clients pensent de notre restaurant",
    google_business_url: "https://www.google.com/maps/place/SushiEats/@43.8828,4.8535,15z",
    total_reviews: 150,
    average_rating: 4.8,
    button_text: "Voir tous nos avis Google",
    review_button_text: "Laisser un avis"
  },
  delivery_zones: [
    "Châteaurenard", "Eyragues", "Barbentane", "Rognonas", 
    "Graveson", "Maillane", "Noves", "Cabanes", 
    "Avignon", "Saint-Rémy de Provence", "Boulbon"
  ],
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
  ],
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
};

const Index = () => {
  // Use the homepage data hook
  const { data: homepageData, loading } = useHomepageData();
  const { activePromotions } = usePromotions();
  
  // Mark promotions as active based on day-based promotions
  const promotionsWithActive = (homepageData?.promotions || DEFAULT_HOMEPAGE_DATA.promotions).map(promo => {
    if (promo.id === 2) { // ID of the "1 Plateau Acheté = 1 Dessert Offert" promotion
      return { ...promo, isActive: true };
    }
    // Check if any active promotion matches this promotion
    const hasActivePromotion = activePromotions.some(activePromo => 
      activePromo.title === promo.title || 
      (promo.id === 1 && activePromo.applicableCategories?.includes('box_du_midi'))
    );
    return { ...promo, isActive: hasActivePromotion };
  });

  // Check if there are any promotions to display (active promotions or promotions with isActive flag)
  const hasPromotionsToDisplay = activePromotions.length > 0 || promotionsWithActive.some(promo => promo.isActive);
  
  return (
    <>
      {/* Hero Section */}
      <HeroSection 
        background_image={homepageData?.hero_section?.background_image || DEFAULT_HOMEPAGE_DATA.hero_section.background_image}
        title={homepageData?.hero_section?.title || DEFAULT_HOMEPAGE_DATA.hero_section.title}
        subtitle={homepageData?.hero_section?.subtitle || DEFAULT_HOMEPAGE_DATA.hero_section.subtitle}
      />

      {/* Order Call-to-Action */}
      <OrderCTA />

      {/* Custom Creation Section */}
      {homepageData?.custom_creation_section && (
        <CustomCreationSection data={homepageData.custom_creation_section} />
      )}

      {/* Featured Products Section */}
      <FeaturedProductsSection />

      {/* Google Reviews Section */}
      <GoogleReviewsSection />

      {/* Delivery Map */}
      <DeliveryMap deliveryZones={homepageData?.delivery_zones || DEFAULT_HOMEPAGE_DATA.delivery_zones} />

      {/* Promotions - Only show if there are promotions to display */}
      {hasPromotionsToDisplay && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 better-times-gold">Nos Promotions du Moment</h2>
            {activePromotions.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">🎉 Promotions actives aujourd'hui :</h3>
                <ul className="space-y-1">
                  {activePromotions.map(promo => (
                    <li key={promo.id} className="text-red-700">
                      • {promo.title} - {promo.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotionsWithActive.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Index;
