
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MenuItem } from "@/types";

const Commander = () => {
  const { toast } = useToast();
  const cart = useCart();
  const [activeCategory, setActiveCategory] = useState("sushi");

  const menuItems = {
    sushi: [
      {
        id: "1",
        name: "Assortiment de Sushi",
        description: "8 pièces variées de nos meilleurs sushi",
        price: 14.90,
        category: "plateaux" as const,
        imageUrl: "/lovable-uploads/0f3ef4af-3737-45b0-a552-0c84028dd3cd.png"
      },
      {
        id: "2",
        name: "Sashimi de Saumon",
        description: "Tranches fines de saumon frais",
        price: 12.50,
        category: "sashimi" as const,
        imageUrl: "/lovable-uploads/8d6a0ad3-bf3f-48f8-b427-7d4db8f4b26b.png"
      },
      {
        id: "3",
        name: "California Roll",
        description: "Avocat, crabe, concombre et tobiko",
        price: 10.90,
        category: "california" as const,
        imageUrl: "/lovable-uploads/410b6967-e49b-4913-9f13-24e5279ee4f5.png"
      }
    ],
    plats: [
      {
        id: "4",
        name: "Ramen au Porc",
        description: "Nouilles dans un bouillon riche avec porc chashu",
        price: 16.90,
        category: "plateaux" as const,
        imageUrl: "/lovable-uploads/c30dd633-dfec-4589-afdf-9cf0abf72049.png"
      },
      {
        id: "5",
        name: "Yakitori",
        description: "Brochettes de poulet grillées à la sauce teriyaki",
        price: 9.50,
        category: "yakitori" as const,
        imageUrl: "/lovable-uploads/ab0cbaa4-7dab-449d-b422-e426b7812e41.png"
      }
    ],
    desserts: [
      {
        id: "6",
        name: "Mochi Glacé",
        description: "Boules de glace enrobées de pâte de riz",
        price: 6.90,
        category: "desserts" as const,
        imageUrl: "/lovable-uploads/2443ae61-1e76-42ea-a1fd-0506bb67f970.png"
      }
    ]
  };

  const addToCart = (item: MenuItem) => {
    cart.addItem(item, 1);
    
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Commander</h1>
        <p className="text-gray-600 text-center mb-12">
          Commandez en ligne et récupérez votre repas dans notre restaurant
        </p>

        <Tabs 
          defaultValue="sushi" 
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="sushi">Sushi & Sashimi</TabsTrigger>
            <TabsTrigger value="plats">Plats Chauds</TabsTrigger>
            <TabsTrigger value="desserts">Desserts</TabsTrigger>
          </TabsList>

          {Object.keys(menuItems).map(category => (
            <TabsContent key={category} value={category} className="space-y-6">
              {menuItems[category].map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/3 h-48 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-full md:w-2/3 p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold">{item.name}</h3>
                            <Badge className="bg-akane-600">{item.price.toFixed(2)} €</Badge>
                          </div>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                        <Button 
                          onClick={() => addToCart(item)} 
                          className="mt-4 bg-akane-600 hover:bg-akane-700 w-full md:w-auto self-end"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Ajouter au panier
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Commander;
