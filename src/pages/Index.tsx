
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

    // Rotation automatique des promotions
    const interval = setInterval(() => {
      setActivePromotion((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      clearInterval(interval);
    };
  }, []);

  // Données factices pour les promotions
  const promotions = [
    {
      id: 1,
      title: "Box du Midi à -20%",
      description: "Du mardi au vendredi, profitez de -20% sur nos box du midi !",
      imageUrl: "/public/lovable-uploads/ab0cbaa4-7dab-449d-b422-e426b7812e41.png",
      buttonText: "En profiter",
      buttonLink: "/menu",
    },
    {
      id: 2,
      title: "1 Plateau Acheté = 1 Dessert Offert",
      description: "Pour toute commande d'un plateau, recevez un dessert au choix offert !",
      imageUrl: "/public/lovable-uploads/c30dd633-dfec-4589-afdf-9cf0abf72049.png",
      buttonText: "Découvrir",
      buttonLink: "/menu",
    },
    {
      id: 3,
      title: "10% sur votre première commande",
      description: "Utilisez le code BIENVENUE pour bénéficier de 10% sur votre première commande en ligne",
      imageUrl: "/public/lovable-uploads/0f3ef4af-3737-45b0-a552-0c84028dd3cd.png",
      buttonText: "Commander",
      buttonLink: "/commander",
    },
  ];

  // Villes desservies
  const deliveryZones = [
    "Châteaurenard", "Eyragues", "Barbentane", "Rognonas", 
    "Graveson", "Maillane", "Noves", "Cabanes", 
    "Avignon", "Saint-Rémy de Provence", "Boulbon"
  ];

  // Meilleurs produits
  const bestSellers = [
    {
      id: 1,
      name: "Le Royal",
      description: "60 pièces - Pour 4-5 personnes",
      price: 75.90,
      image: "/public/lovable-uploads/8d6a0ad3-bf3f-48f8-b427-7d4db8f4b26b.png",
      category: "plateaux",
    },
    {
      id: 2,
      name: "Poké Saumon",
      description: "Bol composé de riz, protéines, légumes et sauce",
      price: 14.90,
      image: "/public/lovable-uploads/410b6967-e49b-4913-9f13-24e5279ee4f5.png",
      category: "poke",
    },
    {
      id: 3,
      name: "Crispy Roll Crevette Tempura",
      description: "6 pièces - Crevette tempura, avocat, épicé",
      price: 7.20,
      image: "/public/lovable-uploads/c30dd633-dfec-4589-afdf-9cf0abf72049.png",
      category: "crispy",
    },
    {
      id: 4,
      name: "Sashimi Saumon",
      description: "5 pièces - Tranches de saumon cru",
      price: 6.30,
      image: "/public/lovable-uploads/2443ae61-1e76-42ea-a1fd-0506bb67f970.png",
      category: "sashimi",
    },
  ];

  // Options de commande
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
      {/* Bannière principale */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/public/lovable-uploads/8d6a0ad3-bf3f-48f8-b427-7d4db8f4b26b.png')",
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

        {/* Info bar */}
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

      {/* Carrousel de promotions */}
      <section className="py-20 bg-sushi-50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.h2
              className="text-gray-900 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Nos offres spéciales
            </motion.h2>
            <motion.div
              className="w-20 h-1 bg-akane-500 mx-auto mb-6"
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: 80 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            ></motion.div>
            <motion.p
              className="text-gray-600 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Profitez de nos promotions exclusives pour découvrir notre carte à des prix avantageux
            </motion.p>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-xl shadow-xl">
              {promotions.map((promo, index) => (
                <motion.div
                  key={promo.id}
                  className={`flex flex-col md:flex-row ${index === activePromotion ? "block" : "hidden"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-full md:w-1/2 bg-gradient-to-r from-akane-700 to-akane-500 p-8 md:p-12 flex items-center">
                    <div className="text-white">
                      <h3 className="text-2xl md:text-3xl font-bold mb-4">{promo.title}</h3>
                      <p className="mb-6">{promo.description}</p>
                      <Button asChild className="bg-white text-akane-600 hover:bg-gray-100">
                        <Link to={promo.buttonLink}>
                          {promo.buttonText} <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div
                    className="w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center"
                    style={{ backgroundImage: `url(${promo.imageUrl})` }}
                  ></div>
                </motion.div>
              ))}
            </div>

            {/* Indicateurs */}
            <div className="flex justify-center mt-6 space-x-2">
              {promotions.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activePromotion ? "bg-akane-600" : "bg-gray-300"
                  }`}
                  onClick={() => setActivePromotion(index)}
                  aria-label={`Voir promotion ${index + 1}`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Zone de livraison */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-gray-900 mb-4">Zone de livraison</h2>
            <div className="w-20 h-1 bg-akane-500 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nous livrons dans un rayon de 20km autour de Châteaurenard. Vérifiez si votre ville est desservie par notre service de livraison.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {deliveryZones.map((zone, index) => (
              <motion.div
                key={index}
                className="bg-sushi-50 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                variants={fadeInUp}
              >
                <MapPin className="h-5 w-5 text-akane-500 mx-auto mb-2" />
                <p className="font-medium text-gray-800">{zone}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-center mt-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Alert className="max-w-2xl mx-auto bg-akane-50 border-akane-200 text-akane-800">
              <AlertDescription>
                Pour les communes hors zone de livraison, vous pouvez opter pour le retrait en restaurant.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-20 bg-sushi-100">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-gray-900 mb-4">Nos best-sellers</h2>
            <div className="w-20 h-1 bg-akane-500 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez les produits préférés de nos clients, des saveurs qui ont conquis nos gourmets les plus exigeants.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {bestSellers.map((product) => (
              <motion.div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                variants={fadeInUp}
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-akane-600 hover:bg-akane-700">Best-seller</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-lg text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-akane-600 font-semibold">{product.price.toFixed(2)} €</span>
                    <Button asChild variant="ghost" className="text-akane-600 hover:text-akane-700 hover:bg-akane-50 p-0 h-auto">
                      <Link to={`/menu#${product.category}`}>
                        Voir détails <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <Button asChild className="bg-akane-600 hover:bg-akane-700 text-white">
              <Link to="/menu">Voir toute notre carte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comment commander */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-gray-900 mb-4">Comment commander</h2>
            <div className="w-20 h-1 bg-akane-500 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choisissez l'option qui vous convient le mieux pour déguster nos sushis.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {orderOptions.map((option, index) => (
              <motion.div
                key={index}
                className="border border-gray-200 rounded-lg p-6 text-center hover:border-akane-200 hover:shadow-md transition-all"
                variants={fadeInUp}
              >
                <div className="flex justify-center mb-4">{option.icon}</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{option.title}</h3>
                <p className="text-gray-600 mb-4">{option.description}</p>
                <Separator className="my-4" />
                <Button asChild variant="ghost" className="text-akane-600 hover:text-akane-700 hover:bg-akane-50">
                  <Link to="/commander">
                    Commander <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-akane-800 to-akane-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Envie de sushi ? Commandez maintenant !
          </motion.h2>
          <motion.p
            className="text-white/80 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Créez votre compte et gagnez des points de fidélité à chaque commande.
            Livraison rapide et service de qualité garantis.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button asChild className="bg-white text-akane-600 hover:bg-gray-100 py-6 px-8 text-base">
              <Link to="/commander">Commander en ligne</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
