
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import contactHeroImage from "@/assets/contact-hero.jpg";

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone?: string;
  email?: string;
  display_order: number;
  hours: RestaurantHour[];
}

interface RestaurantHour {
  day_of_week: number;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
}

const dayNames = [
  "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"
];

const getDayDisplayOrder = (dayOfWeek: number) => {
  // Convertit l'index de base de données (0=Dimanche, 1=Lundi...) vers l'ordre d'affichage français (0=Lundi, 1=Mardi...)
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
  subject: z.string().min(5, {
    message: "Le sujet doit contenir au moins 5 caractères.",
  }),
  message: z.string().min(10, {
    message: "Le message doit contenir au moins 10 caractères.",
  }),
});

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Récupérer les restaurants
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from('restaurants_info')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (restaurantsError) throw restaurantsError;

        // Récupérer les horaires pour tous les restaurants
        const { data: hoursData, error: hoursError } = await supabase
          .from('restaurants_info_hours')
          .select('*')
          .order('day_of_week');

        if (hoursError) throw hoursError;

        // Associer les horaires aux restaurants
        const restaurantsWithHours = restaurantsData.map(restaurant => ({
          ...restaurant,
          hours: hoursData.filter(hour => hour.restaurant_info_id === restaurant.id)
        }));

        setRestaurants(restaurantsWithHours);
      } catch (error) {
        console.error("Erreur lors du chargement des restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Garde seulement HH:MM
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
        },
      });

      if (error) {
        console.error('Erreur lors de l\'envoi:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Message envoyé!",
          description: "Nous vous répondrons dans les plus brefs délais.",
        });
        form.reset();
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Une erreur est survenue lors de l'envoi.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Sushieats",
    "description": "Contactez-nous pour toute question, réservation ou demande d'information. Formulaire de contact et coordonnées de nos restaurants.",
    "provider": {
      "@type": "Restaurant",
      "name": "Sushieats",
      "servesCuisine": "Japonaise",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["French"]
      }
    }
  };

  return (
    <>
      <SEOHead 
        title="Contact Restaurant Japonais - Réservation & Questions | Sushieats"
        description="Contactez-nous pour vos réservations, questions ou demandes spéciales. Formulaire de contact, coordonnées et horaires de nos restaurants japonais."
        keywords="contact sushi, réservation restaurant, horaires ouverture, téléphone restaurant, email contact, service client"
        canonical={`${window.location.origin}/contact`}
        ogImage={contactHeroImage}
        ogType="website"
        structuredData={structuredData}
      />
      
      <div className="container mx-auto py-24 px-4">
        {/* Hero image section */}
        <div className="mb-12 relative rounded-xl overflow-hidden">
          <img 
            src={contactHeroImage} 
            alt="Service client restaurant japonais - équipe professionnelle"
            className="w-full h-64 md:h-80 object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Contactez-nous</h1>
              <p className="text-lg md:text-xl max-w-2xl">
                Une question ou une réservation ? N'hésitez pas à nous contacter.
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulaire de contact */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Envoyez-nous un message</h2>
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="votre.email@exemple.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sujet</FormLabel>
                          <FormControl>
                            <Input placeholder="Sujet de votre message" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Votre message..." 
                              className="min-h-32" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-gold-600 hover:bg-gold-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Informations des restaurants */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Nos restaurants</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {restaurants.map((restaurant) => (
                  <Card key={restaurant.id} className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Adresse */}
                      <div className="flex items-start space-x-3">
                        <MapPin className="text-gold-500 mt-1 flex-shrink-0" size={18} />
                        <div>
                          <p className="font-medium">{restaurant.address}</p>
                          <p className="text-gray-600 text-sm">{restaurant.postal_code} {restaurant.city}</p>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="space-y-2">
                        {restaurant.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="text-gold-500 flex-shrink-0" size={18} />
                            <a 
                              href={`tel:${restaurant.phone.replace(/\s/g, '')}`}
                              className="text-gray-900 hover:text-gold-500 transition-colors text-sm"
                            >
                              {restaurant.phone}
                            </a>
                          </div>
                        )}
                        {restaurant.email && (
                          <div className="flex items-center space-x-3">
                            <Mail className="text-gold-500 flex-shrink-0" size={18} />
                            <a 
                              href={`mailto:${restaurant.email}`}
                              className="text-gray-900 hover:text-gold-500 transition-colors text-sm"
                            >
                              {restaurant.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Horaires */}
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Clock className="text-gold-500" size={18} />
                          <h3 className="font-medium">Horaires d'ouverture</h3>
                        </div>
                        <div className="space-y-1">
                          {dayNames.map((dayName, displayIndex) => {
                            // Convertir l'index d'affichage vers l'index de la base de données
                            const dbDayIndex = displayIndex === 6 ? 0 : displayIndex + 1;
                            const dayHours = restaurant.hours.filter(hour => hour.day_of_week === dbDayIndex);
                            const openSlots = dayHours.filter(hour => hour.is_open && hour.open_time && hour.close_time)
                              .sort((a, b) => a.open_time!.localeCompare(b.open_time!));
                            
                            return (
                              <div key={displayIndex} className="flex justify-between items-center text-sm">
                                <span className={`font-medium ${displayIndex === 5 || displayIndex === 6 ? 'text-red-500' : 'text-gray-900'}`}>
                                  {dayName}:
                                </span>
                                {openSlots.length > 0 ? (
                                  <div className="text-gray-600 text-right">
                                    {openSlots.map((slot, slotIndex) => (
                                      <div key={slotIndex}>
                                        {formatTime(slot.open_time!)} - {formatTime(slot.close_time!)}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Badge variant="secondary" className="text-red-500 text-xs">
                                    Fermé
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        </motion.div>
      </div>
    </>
  );
};

export default Contact;
