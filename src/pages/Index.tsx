import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, MapPin, Clock, Truck, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [activePromotion, setActivePromotion] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll(".animate-on-scroll");
    sections.forEach((section) => observer.observe(section));

    const interval = setInterval(() => {
      setActivePromotion((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      clearInterval(interval);
    };
  }, []);

  const promotions = [
    {
      id: 1,
      title: "Box du Midi à -20%",
      description: "Du mardi au vendredi, profitez de -20% sur nos box du midi !",
      imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
      buttonText: "En profiter",
      buttonLink: "/menu",
    },
    {
      id: 2,
      title: "1 Plateau Acheté = 1 Dessert Offert",
      description: "Pour toute commande d'un plateau, recevez un dessert au choix offert !",
      imageUrl: "https://images.unsplash.com/photo-1559410545-0bdcd187e323?q=80&w=1000&auto=format&fit=crop",
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
    },
  ];

  const deliveryZones = [
    "Châteaurenard", "Eyragues", "Barbentane", "Rognonas", 
    "Graveson", "Maillane", "Noves", "Cabanes", 
    "Avignon", "Saint-Rémy de Provence", "Boulbon"
  ];

  const bestSellers = [
    {
      id: 1,
      name: "Le Royal",
      description: "60 pièces - Pour 4-5 personnes",
      price: 75.90,
      image: "https://images.unsplash.com/photo-1563612116625-3012372fccce?q=80&w=1000&auto=format&fit=crop",
      category: "plateaux",
    },
    {
      id: 2,
      name: "Poké Saumon",
      description: "Bol composé de riz, protéines, légumes et sauce",
      price: 14.90,
      image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?q=80&w=1000&auto=format&fit=crop",
      category: "poke",
    },
    {
      id: 3,
      name: "Crispy Roll Crevette Tempura",
      description: "6 pièces - Crevette tempura, avocat, épicé",
      price: 7.20,
      image: "https://images.unsplash.com/photo-1617196035154-1e7e6e28b0db?q=80&w=1000&auto=format&fit=crop",
      category: "crispy",
    },
    {
      id: 4,
      name: "Sashimi Saumon",
      description: "5 pièces - Tranches de saumon cru",
      price: 6.30,
      image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1000&auto=format&fit=crop",
      category: "sashimi",
    },
  ];

  const orderOptions = [
    {
      title: "Livraison",
      description: "Livraison à domicile dans notre zone de chalandise",
      icon: <Truck className="w-8 h-8 text-akane-600" />,
    },
    {
      title: "À emporter",
      description: "Commandez et récupérez en restaurant",
      icon: <ShoppingBag className="w-8 h-8 text-akane-600" />,
    },
    {
      title: "Sur place",
      description: "Profitez de votre repas dans notre restaurant",
      icon: <Users className="w-8 h-8 text-akane-600" />,
    },
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="pt-16">
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <motion.span
              className="inline-block mb-4 text-sm uppercase tracking-wider text-akane-400 bg-black/30 backdrop-blur-md py-1 px-3 rounded-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              Restaurant & Livraison
            </motion.span>

            <motion.h1
              className="text-white mb-4 font-serif"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              L'art du sushi à <span className="text-akane-500">Châteaurenard</span>
            </motion.h1>

            <motion.p
              className="text-white/90 text-lg mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
            >
              Des produits frais, des saveurs authentiques, une expérience japonaise unique à déguster sur place ou à emporter.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
            >
              <Button asChild className="bg-akane-600 hover:bg-akane-700 text-white py-6 px-8 text-base">
                <Link to="/commander">Commander maintenant</Link>
              </Button>
              <Button asChild variant="outline" className="bg-black/40 text-white border-white/20 hover:bg-black/60 hover:text-white py-6 px-8 text-base backdrop-blur-md">
                <Link to="/menu">Voir notre carte</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md py-4 border-t border-white/20">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-akane-500" />
              <span>16 cours Carnot, 13160 Châteaurenard</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-akane-500" />
              <span>Mardi - Dimanche: 11h-14h & 18h-22h</span>
            </div>
            <div>
              <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <a href="tel:+33490000000">04 90 00 00 00</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <
