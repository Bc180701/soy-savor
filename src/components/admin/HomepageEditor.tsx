
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import HeroSectionEditor from "./homepage-editor/HeroSectionEditor";
import PromotionsEditor from "./homepage-editor/PromotionsEditor";
import DeliveryZonesEditor from "./homepage-editor/DeliveryZonesEditor";
import OrderOptionsEditor from "./homepage-editor/OrderOptionsEditor";
import { HomepageData } from "@/hooks/useHomepageData";

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

const HomepageEditor = () => {
  const [loading, setLoading] = useState(true);
  const [homepageData, setHomepageData] = useState<HomepageData>(DEFAULT_HOMEPAGE_DATA);
  const { toast } = useToast();

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      setLoading(true);
      
      // Check if homepage_sections table exists
      const { data: tableExists } = await supabase.rpc('check_table_exists', {
        table_name: 'homepage_sections'
      }).single();
      
      if (tableExists) {
        // Use RPC function to fetch homepage data as JSON
        const { data, error } = await supabase.rpc('get_homepage_data').single();

        if (error) {
          throw error;
        }

        // Cast the data to our expected type
        setHomepageData(data as HomepageData || DEFAULT_HOMEPAGE_DATA);
      } else {
        setHomepageData(DEFAULT_HOMEPAGE_DATA);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la page d'accueil",
        variant: "destructive",
      });
      setHomepageData(DEFAULT_HOMEPAGE_DATA);
    } finally {
      setLoading(false);
    }
  };

  const saveHomepageData = async (section: string, data: any) => {
    try {
      const updatedData = {
        ...homepageData,
        [section]: data
      };

      // Check if homepage_sections table exists
      const { data: tableExists } = await supabase.rpc('check_table_exists', {
        table_name: 'homepage_sections'
      }).single();
      
      if (tableExists) {
        // Use RPC function to update homepage data
        const { error } = await supabase.rpc('update_homepage_data', { 
          section_name: section,
          section_data: JSON.stringify(data)
        });

        if (error) throw error;
        
        setHomepageData(updatedData);
        
        toast({
          title: "Enregistré",
          description: `Les modifications de la section ont été enregistrées.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Erreur",
          description: "La table homepage_sections n'existe pas encore. Veuillez exécuter les migrations SQL.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Personnalisation de la page d'accueil</h2>
        <p className="text-muted-foreground mb-6">
          Modifiez les différentes sections de votre page d'accueil pour personnaliser votre site.
        </p>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hero">Section Principale</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="delivery">Zones de livraison</TabsTrigger>
          <TabsTrigger value="order">Options de commande</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Section principale</CardTitle>
              <CardDescription>
                Personnalisez l'image de fond, le titre et le sous-titre de la section principale.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeroSectionEditor 
                data={homepageData.hero_section} 
                onSave={(data) => saveHomepageData('hero_section', data)} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotions</CardTitle>
              <CardDescription>
                Gérez les promotions qui apparaissent sur la page d'accueil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromotionsEditor 
                data={homepageData.promotions} 
                onSave={(data) => saveHomepageData('promotions', data)} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Zones de livraison</CardTitle>
              <CardDescription>
                Modifiez les zones de livraison affichées sur la page d'accueil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryZonesEditor 
                data={homepageData.delivery_zones} 
                onSave={(data) => saveHomepageData('delivery_zones', data)} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle>Options de commande</CardTitle>
              <CardDescription>
                Personnalisez les options de commande affichées sur la page d'accueil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderOptionsEditor 
                data={homepageData.order_options} 
                onSave={(data) => saveHomepageData('order_options', data)} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HomepageEditor;
