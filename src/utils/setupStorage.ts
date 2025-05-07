
import { supabase } from "@/integrations/supabase/client";

export const setupStorage = async () => {
  try {
    // Check if homepage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.some(b => b.name === 'homepage')) {
      // Create homepage bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket('homepage', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Error creating homepage bucket:', error);
      } else {
        console.log('Homepage bucket created successfully');
      }
    }

    // Setup the initial homepage data if it doesn't exist
    // @ts-ignore - Using a generic query to check if homepage_sections table exists
    const { count, error: countError } = await supabase
      .from('homepage_sections')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.log('Homepage sections table might not exist yet:', countError);
      return;
    }
    
    if (count === 0) {
      console.log('No homepage data found, creating initial data...');
      
      try {
        // @ts-ignore - We're using a workaround until the database schema is updated
        const { error } = await supabase
          .from('homepage_sections')
          .insert({
            id: 1,
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
          });
          
        if (error) {
          console.error('Error creating initial homepage data:', error);
        } else {
          console.log('Initial homepage data created successfully');
        }
      } catch (err) {
        console.error('Error creating initial homepage data:', err);
      }
    }
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
};
