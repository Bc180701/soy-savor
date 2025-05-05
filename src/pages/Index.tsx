
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, MapPin, Clock, Truck, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import FeaturedProductsSection from "@/components/FeaturedProductsSection";

const Index = () => {
  const [activePromotion, setActivePromotion] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [registerPromotion, setRegisterPromotion] = useState(null);
  const [loadingPromotion, setLoadingPromotion] = useState(true);
  const [user, setUser] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState({
    new: [],
    popular: [],
    exclusive: []
  });
  const [loadingProducts, setLoadingProducts] = useState(true);

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

    const fetchRegisterPromotion = async () => {
      try {
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('title', '-10% sur votre première commande')
          .single();
        
        if (error) {
          console.error("Erreur lors de la récupération de la promotion:", error);
        } else {
          setRegisterPromotion(data);
        }
      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setLoadingPromotion(false);
      }
    };
    
    const fetchFeaturedProducts = async () => {
      try {
        // Get new products (flagged as is_new)
        const { data: newProducts } = await supabase
          .from('products')
          .select('*')
          .eq('is_new', true)
          .order('created_at', { ascending: false })
          .limit(3);
        
        // Get popular products (based on order count)
        const { data: popularProducts } = await supabase
          .from('popular_products')
          .select('products(*)')
          .order('order_count', { ascending: false })
          .limit(4);
        
        // Get exclusive products (best sellers)
        const { data: exclusiveProducts } = await supabase
          .from('products')
          .select('*')
          .eq('is_best_seller', true)
          .limit(3);
          
        const formattedPopularProducts = popularProducts?.map(item => ({
          id: item.products.id,
          name: item.products.name,
          description: item.products.description,
          price: item.products.price,
          image: item.products.image_url || "/placeholder.svg",
          category: "populaire"
        })) || [];
        
        setFeaturedProducts({
          new: newProducts?.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image_url || "/placeholder.svg",
            category: "nouveauté"
          })) || [],
          popular: formattedPopularProducts,
          exclusive: exclusiveProducts?.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image_url || "/placeholder.svg", 
            category: "exclusivité"
          })) || []
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des produits:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    fetchRegisterPromotion();
    fetchFeaturedProducts();

    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      clearInterval(interval);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const promotions = [
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
    },
  ];

  const deliveryZones = [
    "Châteaurenard", "Eyragues", "Barbentane", "Rognonas", 
    "Graveson", "Maillane", "Noves", "Cabanes", 
    "Avignon", "Saint-Rémy de Provence", "Boulbon"
  ];

  const orderOptions = [
    {
      title: "Livraison",
      description: "Livraison à domicile dans notre zone de chalandise",
      icon: <Truck className="w-8 h-8 text-gold-600" />,
    },
    {
      title: "À emporter",
      description: "Commandez et récupérez en restaurant",
      icon: <ShoppingBag className="w-8 h-8 text-gold-600" />,
    },
    {
      title: "Sur place",
      description: "Profitez de votre repas dans notre restaurant",
      icon: <Users className="w-8 h-8 text-gold-600" />,
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
              className="inline-block mb-4 text-sm uppercase tracking-wider text-gold-400 bg-black/30 backdrop-blur-md py-1 px-3 rounded-full"
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
              L'art du sushi à <span className="text-gold-500">Châteaurenard</span>
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
              <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white py-6 px-8 text-base">
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
              <MapPin className="h-5 w-5 text-gold-500" />
              <span>16 cours Carnot, 13160 Châteaurenard</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-gold-500" />
              <span>Mardi - Dimanche: 11h-14h30 & 18h30-22h30</span>
            </div>
            <div>
              <Button asChild variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <a href="tel:+33490000000">04 90 00 00 00</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {!user && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Nos offres spéciales</h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Profitez de nos promotions exclusives pour vos commandes sur place, à emporter ou en livraison.
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto overflow-hidden rounded-xl shadow-lg">
              {promotions.map((promo, index) => (
                <div
                  key={promo.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === activePromotion ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-1/2 bg-cover bg-center h-64 md:h-auto" style={{ backgroundImage: `url(${promo.imageUrl})` }}></div>
                    <div className="md:w-1/2 bg-white p-8 flex flex-col justify-center">
                      <Badge variant="outline" className="w-fit mb-3 bg-gold-50 text-gold-700 border-gold-200">
                        Offre spéciale
                      </Badge>
                      <h3 className="text-2xl font-bold mb-3">{promo.title}</h3>
                      <p className="text-gray-600 mb-6">{promo.description}</p>
                      <Button asChild className="w-fit">
                        <Link to={promo.buttonLink}>
                          {promo.buttonText} <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center space-x-2">
                {promotions.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activePromotion ? "bg-gold-600" : "bg-gray-300"
                    }`}
                    onClick={() => setActivePromotion(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {!loadingPromotion && registerPromotion && (
              <div className="mt-12 max-w-4xl mx-auto">
                <div className="rounded-lg shadow-lg overflow-hidden bg-gold-50 border border-gold-300">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/2 p-8 flex flex-col justify-center">
                      <Badge className="bg-gold-100 text-gold-800 border-0 mb-3 w-fit">OFFRE SPÉCIALE</Badge>
                      <h3 className="text-2xl font-bold mb-3 text-gold-900">-10% sur votre première commande</h3>
                      <p className="text-gold-800 mb-6">Créez un compte maintenant et profitez de 10% de réduction sur votre prochaine commande!</p>
                      <Button asChild className="w-fit bg-gold-600 hover:bg-gold-700 text-white">
                        <Link to="/register">
                          Créer un compte <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <div className="md:w-1/2">
                      <img
                        src="https://img.freepik.com/free-photo/sushi-set-hot-rolls-avocado-california-salmon-rolls_141793-1279.jpg?t=st=1744876692~exp=1744880292~hmac=3b12a9326da6e322a4b26738c6708653d5983c480eccd6a510feac3bc90ae31a&w=1380"
                        alt="Promotion inscription"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Nouvelle section avec FeaturedProductsSection remplaçant l'ancienne section bestSellers */}
      {!loadingProducts && (
        <FeaturedProductsSection 
          newProducts={featuredProducts.new}
          popularProducts={featuredProducts.popular}
          exclusiveProducts={featuredProducts.exclusive}
        />
      )}

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Comment commander ?</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Choisissez l'option qui vous convient le mieux pour profiter de nos délicieux plats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {orderOptions.map((option, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md text-center"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true, amount: 0.1 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-gold-50 w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center">
                  {option.icon}
                </div>
                <h3 className="font-bold text-xl mb-2">{option.title}</h3>
                <p className="text-gray-600">{option.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white py-6 px-8 text-base">
              <Link to="/commander">Commander maintenant</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Zones de livraison</h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Nous livrons à Châteaurenard et dans les communes environnantes.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <Alert className="mb-6 bg-gold-50 text-gold-700 border-gold-200">
                <AlertDescription>
                  Livraison offerte à partir de 30€ de commande, sinon 3€ de frais de livraison.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {deliveryZones.map((zone, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gold-600" />
                    <span>{zone}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <p className="text-sm text-gray-600 text-center">
                Pour toute autre commune, n'hésitez pas à nous contacter pour vérifier si nous pouvons vous livrer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gold-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Envie de déguster sur place ?</h2>
          <p className="mb-8 max-w-xl mx-auto">
            Réservez votre table et venez profiter de nos spécialités dans notre restaurant.
          </p>
          <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white/20">
            <a href="tel:+33490000000">Appeler pour réserver</a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
