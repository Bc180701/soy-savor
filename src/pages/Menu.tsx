
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { getMenuData } from "@/services/productService";
import { MenuCategory } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();
    
    const fetchMenuData = async () => {
      setIsLoading(true);
      try {
        console.time('Loading Menu Data');
        // Utiliser la fonction optimisée qui charge tout en une seule requête
        const menuData = await getMenuData();
        console.timeEnd('Loading Menu Data');
        
        setCategories(menuData);
        
        // Set the active category to the first one if available
        if (menuData.length > 0 && !activeCategory) {
          setActiveCategory(menuData[0].id);
        }
      } catch (error) {
        console.error("Error loading menu data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du menu.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, [toast, activeCategory]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
        <span className="ml-2">Chargement du menu...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Notre Menu</h1>
        <p className="text-gray-600 text-center mb-12">
          Découvrez nos spécialités japonaises préparées avec soin
        </p>

        {!isAuthenticated && (
          <motion.div 
            className="mb-8 bg-gradient-to-r from-gold-500 to-gold-300 p-6 rounded-lg shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Badge className="bg-white text-gold-600 mb-2">OFFRE SPÉCIALE</Badge>
            <h3 className="text-white text-xl font-bold mb-2">-10% sur votre première commande</h3>
            <p className="text-white/90 mb-4">Créez un compte maintenant pour profiter de cette promotion exclusive</p>
            <Button asChild className="bg-white hover:bg-gray-100 text-gold-600">
              <Link to="/register">Créer un compte</Link>
            </Button>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4">
            <div className="sticky top-24">
              <h2 className="text-xl font-bold mb-4">Catégories</h2>
              <ScrollArea className="h-[70vh] pr-4">
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <button
                        onClick={() => setActiveCategory(category.id)}
                        className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                          activeCategory === category.id
                            ? "bg-gold-600 text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {category.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>

          <div className="md:w-3/4">
            <AnimatePresence mode="wait">
              {categories.map((category) => (
                activeCategory === category.id && (
                  <motion.div 
                    key={category.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold">{category.name}</h2>
                      {category.description && (
                        <p className="text-gray-600 italic mt-1">{category.description}</p>
                      )}
                      <Separator className="my-4" />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <AnimatePresence>
                        {category.items.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                          >
                            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                              <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                  {item.imageUrl && item.imageUrl !== "/placeholder.svg" && (
                                    <div className="w-full md:w-1/4 overflow-hidden">
                                      <AspectRatio ratio={1/1} className="h-full">
                                        <img
                                          src={item.imageUrl}
                                          alt={item.name}
                                          className="w-full h-full object-contain bg-[#f9fafb]"
                                        />
                                      </AspectRatio>
                                    </div>
                                  )}
                                  <div className={`w-full ${item.imageUrl && item.imageUrl !== "/placeholder.svg" ? "md:w-3/4" : ""} p-6`}>
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h3 className="text-lg font-bold">{item.name}</h3>
                                        {item.description && (
                                          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                                        )}
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="font-semibold text-gold-600">
                                          {item.price.toFixed(2)} €
                                        </span>
                                        {item.isBestSeller && (
                                          <Badge className="bg-gold-600 mt-2">Populaire</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Menu;
