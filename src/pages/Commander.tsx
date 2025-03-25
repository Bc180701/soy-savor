
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem, MenuCategory } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { getMenuData } from "@/services/productService";

const Commander = () => {
  const { toast } = useToast();
  const cart = useCart();
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenuData = async () => {
      setIsLoading(true);
      try {
        const menuData = await getMenuData();
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
  }, [toast]);

  const addToCart = (item: MenuItem) => {
    cart.addItem(item, 1);
    
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
  };

  // Render horizontal categories for mobile
  const renderMobileCategories = () => (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4">Catégories</h2>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {categories.map((category) => (
            <CarouselItem key={category.id} className="pl-2 basis-auto">
              <button
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-md transition-colors ${
                  activeCategory === category.id
                    ? "bg-akane-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex left-0" />
        <CarouselNext className="hidden sm:flex right-0" />
      </Carousel>
    </div>
  );

  // Render desktop sidebar categories
  const renderDesktopCategories = () => (
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
                      ? "bg-akane-600 text-white"
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
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-24 px-4 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-akane-600" />
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
        <h1 className="text-4xl font-bold text-center mb-2">Commander</h1>
        <p className="text-gray-600 text-center mb-12">
          Commandez en ligne et récupérez votre repas dans notre restaurant
        </p>

        {/* Show horizontal scrolling categories on mobile */}
        {isMobile && renderMobileCategories()}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Show vertical categories sidebar on desktop */}
          {!isMobile && renderDesktopCategories()}

          <div className={isMobile ? "w-full" : "md:w-3/4"}>
            {categories.map((category) => (
              <div 
                key={category.id} 
                className={activeCategory === category.id ? "block" : "hidden"}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold bg-akane-50 p-3 rounded-lg border-l-4 border-akane-600 mb-4">
                    ## {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-gray-600 italic mt-1 mb-4">{category.description}</p>
                  )}
                  <Separator className="my-4" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {category.items.length === 0 ? (
                    <p className="text-center text-gray-500 italic py-8">
                      Aucun produit disponible dans cette catégorie
                    </p>
                  ) : (
                    category.items.map((item) => (
                      <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            {item.imageUrl && item.imageUrl !== "/placeholder.svg" && (
                              <div className="w-full md:w-1/4 h-32 overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className={`w-full ${item.imageUrl && item.imageUrl !== "/placeholder.svg" ? "md:w-3/4" : ""} p-6`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="text-lg font-bold">{item.name}</h3>
                                  {item.description && (
                                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                                  )}
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {item.isVegetarian && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        Végétarien
                                      </Badge>
                                    )}
                                    {item.isSpicy && (
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                        Épicé
                                      </Badge>
                                    )}
                                    {item.isNew && (
                                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        Nouveau
                                      </Badge>
                                    )}
                                    {item.isBestSeller && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        Populaire
                                      </Badge>
                                    )}
                                    {item.pieces && (
                                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                        {item.pieces} pièces
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <Badge className="bg-akane-600">
                                    {item.price.toFixed(2)} €
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                onClick={() => addToCart(item)} 
                                className="mt-4 bg-akane-600 hover:bg-akane-700 w-full md:w-auto self-end float-right"
                              >
                                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter au panier
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Commander;
