
import { useEffect, useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { OrderCTA } from "@/components/OrderCTA";
import { OrderOptions } from "@/components/OrderOptions";
import { DeliveryMap } from "@/components/DeliveryMap";
import { PromotionCard } from "@/components/PromotionCard";
import { CustomCreationSection } from "@/components/CustomCreationSection";
import FeaturedProductsSection from "@/components/FeaturedProductsSection";
import { useHomepageData, HomepageData } from "@/hooks/useHomepageData";
import { supabase } from "@/integrations/supabase/client";

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
      isActive: true, // Mark this promotion as active
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

const Index = () => {
  // Use the homepage data hook
  const { data: homepageData, loading } = useHomepageData();
  
  // Mark promotion as active
  const promotionsWithActive = (homepageData?.promotions || DEFAULT_HOMEPAGE_DATA.promotions).map(promo => {
    if (promo.id === 2) { // ID of the "1 Plateau Acheté = 1 Dessert Offert" promotion
      return { ...promo, isActive: true };
    }
    return promo;
  });
  
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

      {/* Order Options */}
      <OrderOptions options={homepageData?.order_options || DEFAULT_HOMEPAGE_DATA.order_options} />

      {/* Custom Creation Section */}
      {homepageData?.custom_creation_section && (
        <CustomCreationSection data={homepageData.custom_creation_section} />
      )}

      {/* Featured Products Section */}
      <FeaturedProductsSection />

      {/* Delivery Map */}
      <DeliveryMap deliveryZones={homepageData?.delivery_zones || DEFAULT_HOMEPAGE_DATA.delivery_zones} />

      {/* Promotions */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Nos Promotions du Moment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotionsWithActive.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
