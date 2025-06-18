
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Phone, Mail, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { ContactInfo } from "@/hooks/useHomepageData";

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
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: "16 cours Carnot, 13160 Châteaurenard",
    phone: "04 90 00 00 00",
    email: "contact@sushieats.fr"
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('homepage_sections')
          .select('section_data')
          .eq('section_name', 'contact_info')
          .single();
        
        if (error) {
          console.error("Erreur lors de la récupération des coordonnées de contact:", error);
          return;
        }
        
        if (data && data.section_data) {
          setContactInfo(data.section_data as unknown as ContactInfo);
        }
      } catch (error) {
        console.error("Exception lors de la récupération des coordonnées de contact:", error);
      }
    };
    
    fetchContactInfo();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // Simuler un envoi d'email
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message envoyé!",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      form.reset();
    }, 1500);
  }

  const contactInfoList = [
    {
      icon: Phone,
      title: "Téléphone",
      details: [contactInfo.phone],
    },
    {
      icon: Mail,
      title: "Email",
      details: [contactInfo.email],
    },
    {
      icon: Clock,
      title: "Horaires d'ouverture",
      details: ["Lun-Ven: 11h30 - 14h30, 18h30 - 22h30", "Sam-Dim: 18h30 - 23h00"],
    },
  ];

  if (isMobile) {
    return (
      <div className="container mx-auto py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-center mb-2">Contactez-nous</h1>
          <p className="text-gray-600 text-center mb-8">
            Une question ou une réservation ? N'hésitez pas à nous contacter.
          </p>

          <Tabs defaultValue="coordonnees" className="w-full">
            <div className="w-full border-b border-gray-200 mb-6 overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="flex w-max min-w-full h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="coordonnees" 
                    className="flex-1 min-w-[50%] py-3 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-gold-600 data-[state=active]:text-gold-600 data-[state=active]:bg-transparent rounded-none whitespace-nowrap"
                  >
                    Coordonnées
                  </TabsTrigger>
                  <TabsTrigger 
                    value="message" 
                    className="flex-1 min-w-[50%] py-3 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-gold-600 data-[state=active]:text-gold-600 data-[state=active]:bg-transparent rounded-none whitespace-nowrap"
                  >
                    Message
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <TabsContent value="coordonnees" className="mt-6">
              <div className="space-y-6">
                {contactInfoList.map((info, index) => (
                  <div key={index} className="flex items-start">
                    <div className="mt-1 mr-4 bg-gold-100 p-2 rounded-full text-gold-600">
                      <info.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{info.title}</h3>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-gray-600">{detail}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="message" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-6">Envoyez-nous un message</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Contactez-nous</h1>
        <p className="text-gray-600 text-center mb-12">
          Une question ou une réservation ? N'hésitez pas à nous contacter.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-6">Nos Coordonnées</h2>
            <div className="space-y-6">
              {contactInfoList.map((info, index) => (
                <div key={index} className="flex items-start">
                  <div className="mt-1 mr-4 bg-gold-100 p-2 rounded-full text-gold-600">
                    <info.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{info.title}</h3>
                    {info.details.map((detail, i) => (
                      <p key={i} className="text-gray-600">{detail}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-6">Envoyez-nous un message</h2>
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
      </motion.div>
    </div>
  );
};

export default Contact;
