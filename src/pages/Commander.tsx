
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
import { ScrollArea } from "@/components/ui/scroll-area";

const Commander = () => {
  const { toast } = useToast();
  const cart = useCart();
  const [activeCategory, setActiveCategory] = useState("box_du_midi");

  // Using the same comprehensive menu data structure as in Menu.tsx
  const categories = [
    {
      id: "box_du_midi",
      name: "Box du Midi",
      description: "Midi uniquement de 11h à 14h, Accompagnements offerts : riz, salade de choux, soupe miso",
      items: [
        {
          id: "box1",
          name: "BOX WRAP",
          description: "Maki wrap : Crevette Tempura Avocat, 1 rouleau de printemps",
          price: 12.90,
          isPopular: true,
          category: "box_du_midi",
          imageUrl: "/lovable-uploads/410b6967-e49b-4913-9f13-24e5279ee4f5.png"
        },
        {
          id: "box2",
          name: "LUNCH BOX",
          description: "6 California : Saumon Avocat Cheese, 3 California chèvre miel, 2 Nigiri Saumon",
          price: 16.90,
          isPopular: true,
          category: "box_du_midi",
          imageUrl: "/lovable-uploads/0f3ef4af-3737-45b0-a552-0c84028dd3cd.png"
        },
        {
          id: "box3",
          name: "SUSHIEATS BOX",
          description: "6 Crispy roll : Poulet Tempura Avocat spicy, 3 Gyozas Crevette, 1 Temaki saumon",
          price: 17.90,
          isPopular: true,
          category: "box_du_midi",
          imageUrl: "/lovable-uploads/8d6a0ad3-bf3f-48f8-b427-7d4db8f4b26b.png"
        }
      ]
    },
    {
      id: "plateaux",
      name: "Les Plateaux",
      items: [
        {
          id: "plat1",
          name: "LE GRILLÉ",
          description: "2 Yakitori Bœuf fromage, 2 Yakitori Poulet, 3 Poulet Tempura (7 pcs)",
          price: 15.90,
          isPopular: false,
          category: "plateaux",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "plat2",
          name: "LE CLASSIQUE",
          description: "6 Maki Saumon, 6 California Thon Concombre Avocat, 6 Salmon Roll Cheese (18 pcs)",
          price: 17.90,
          isPopular: true,
          category: "plateaux",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "plat3",
          name: "LE VÉGÉTARIEN",
          description: "6 Maki Avocat Concombre Carotte, 6 California Chèvre Miel, 6 Spring roll Concombre Cheese, 6 Green Avocado Concombre Carotte Cheese (24 pcs)",
          price: 20.90,
          isPopular: false,
          category: "plateaux",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "plat4",
          name: "L'AUTHENTIQUE",
          description: "50 pièces variées pour 3-4 personnes incluant Maki, California, Crispy roll, Spring roll, Gunkan et Nigiri",
          price: 55.90,
          isPopular: true,
          category: "plateaux",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "plat5",
          name: "LE ROYAL",
          description: "60 pièces variées pour 4-5 personnes incluant Maki, California, Crispy roll, Spring roll, Gunkan et Nigiri",
          price: 75.90,
          isPopular: false,
          category: "plateaux",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "plat6",
          name: "LE GOURMAND",
          description: "42 pièces variées pour 2-3 personnes incluant Maki, California, Crispy roll, Spring roll et Nigiri",
          price: 52.90,
          isPopular: false,
          category: "plateaux",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "yakitori",
      name: "Yakitori & Grill",
      description: "Brochettes et fritures japonaises",
      items: [
        {
          id: "yaki1",
          name: "Yakitori Poulet",
          description: "2 pièces",
          price: 5.90,
          isPopular: false,
          category: "yakitori",
          imageUrl: "/lovable-uploads/ab0cbaa4-7dab-449d-b422-e426b7812e41.png"
        },
        {
          id: "yaki2",
          name: "Yakitori Bœuf Fromage",
          description: "2 pièces",
          price: 5.90,
          isPopular: true,
          category: "yakitori",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "yaki3",
          name: "Crevette Tempura",
          description: "3 pièces",
          price: 6.40,
          isPopular: false,
          category: "yakitori",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "yaki4",
          name: "Poulet Tempura",
          description: "3 pièces",
          price: 5.90,
          isPopular: true,
          category: "yakitori",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "yaki5",
          name: "Gyoza Poulet",
          description: "3 pièces",
          price: 5.70,
          isPopular: false,
          category: "yakitori",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "yaki6",
          name: "Gyoza Crevettes",
          description: "3 pièces",
          price: 5.90,
          isPopular: false,
          category: "yakitori",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "yaki7",
          name: "Gyoza Veggie",
          description: "3 pièces",
          price: 5.50,
          isPopular: false,
          category: "yakitori",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "accompagnements",
      name: "Accompagnements",
      items: [
        {
          id: "acc1",
          name: "Edamame",
          price: 4.70,
          isPopular: false,
          category: "accompagnements",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "acc2",
          name: "Riz Nature",
          price: 2.70,
          isPopular: false,
          category: "accompagnements",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "acc3",
          name: "Riz Vinaigré",
          price: 3.20,
          isPopular: false,
          category: "accompagnements",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "acc4",
          name: "Soupe Miso",
          price: 3.20,
          isPopular: true,
          category: "accompagnements",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "acc5",
          name: "Rouleau de Printemps",
          price: 6.50,
          isPopular: false,
          category: "accompagnements",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "acc6",
          name: "Salade de Choux",
          price: 3.40,
          isPopular: false,
          category: "accompagnements",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "acc7",
          name: "Salade Wakamé",
          price: 4.90,
          isPopular: false,
          category: "accompagnements",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "sashimi",
      name: "Sashimi & Tataki",
      description: "Tranches de poisson cru ou légèrement snacké (5 ou 10 pièces)",
      items: [
        {
          id: "sashi1",
          name: "Thon",
          description: "5 pièces",
          price: 6.90,
          isPopular: false,
          category: "sashimi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "sashi2",
          name: "Duo Mixte",
          description: "10 pièces",
          price: 12.50,
          isPopular: true,
          category: "sashimi",
          imageUrl: "/lovable-uploads/8d6a0ad3-bf3f-48f8-b427-7d4db8f4b26b.png"
        },
        {
          id: "sashi3",
          name: "Saumon",
          description: "5 pièces",
          price: 6.30,
          isPopular: true,
          category: "sashimi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "sashi4",
          name: "Thon Tataki",
          description: "5 pièces",
          price: 7.40,
          isPopular: false,
          category: "sashimi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "sashi5",
          name: "Duo Mixte Tataki",
          description: "10 pièces",
          price: 12.90,
          isPopular: false,
          category: "sashimi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "sashi6",
          name: "Saumon Tataki",
          description: "5 pièces",
          price: 6.80,
          isPopular: false,
          category: "sashimi",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "california",
      name: "California",
      description: "Rouleau inversé, riz à l'extérieur (6 pièces)",
      items: [
        {
          id: "cali1",
          name: "Saumon Avocat Cheese",
          price: 6.30,
          isPopular: true,
          category: "california",
          imageUrl: "/lovable-uploads/410b6967-e49b-4913-9f13-24e5279ee4f5.png"
        },
        {
          id: "cali2",
          name: "Thon Concombre Avocat",
          price: 6.50,
          isPopular: false,
          category: "california",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "cali3",
          name: "Thon Cuit Concombre Avocat",
          price: 5.90,
          isPopular: false,
          category: "california",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "cali4",
          name: "Saumon Avocat",
          price: 6.20,
          isPopular: true,
          category: "california",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "cali5",
          name: "Crevette Avocat",
          price: 6.60,
          isPopular: false,
          category: "california",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "cali6",
          name: "Frenchy (foie gras)",
          price: 8.50,
          isPopular: true,
          category: "california",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "cali7",
          name: "Concombre Avocat Cheese",
          price: 5.50,
          isPopular: false,
          category: "california",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "cali8",
          name: "Caesar",
          price: 7.50,
          isPopular: false,
          category: "california",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "cali9",
          name: "Chèvre Miel",
          price: 6.50,
          isPopular: true,
          category: "california",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "cali10",
          name: "Mango'Roll",
          price: 6.90,
          isPopular: false,
          category: "california",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "desserts",
      name: "Desserts",
      items: [
        {
          id: "des1",
          name: "Maki Banane Nutella",
          description: "4 pièces",
          price: 4.50,
          isPopular: true,
          category: "desserts",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "des2",
          name: "Perle de Coco",
          description: "2 pièces",
          price: 4.90,
          isPopular: false,
          category: "desserts",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "des3",
          name: "Cheescake Yuzu",
          price: 4.90,
          isPopular: true,
          category: "desserts",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "des4",
          name: "Fondant Chocolat",
          price: 4.90,
          isPopular: false,
          category: "desserts",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "des5",
          name: "Mango Sticky Rice",
          price: 8.50,
          isPopular: true,
          category: "desserts",
          imageUrl: "/lovable-uploads/2443ae61-1e76-42ea-a1fd-0506bb67f970.png"
        },
        {
          id: "des6",
          name: "Coupe de fruits",
          description: "Ananas, Litchi, Mangue",
          price: 4.90,
          isPopular: false,
          category: "desserts",
          imageUrl: "/placeholder.svg"
        }
      ]
    }
  ];

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
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Commander</h1>
        <p className="text-gray-600 text-center mb-12">
          Commandez en ligne et récupérez votre repas dans notre restaurant
        </p>

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

          <div className="md:w-3/4">
            {categories.map((category) => (
              <div 
                key={category.id} 
                className={activeCategory === category.id ? "block" : "hidden"}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold">{category.name}</h2>
                  {category.description && (
                    <p className="text-gray-600 italic mt-1">{category.description}</p>
                  )}
                  <Separator className="my-4" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {category.items.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="w-full md:w-1/4 h-32 overflow-hidden">
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="w-full md:w-3/4 p-6">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="text-lg font-bold">{item.name}</h3>
                                {item.description && (
                                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                <Badge className="bg-akane-600">{item.price.toFixed(2)} €</Badge>
                                {item.isPopular && (
                                  <Badge variant="outline" className="mt-2">Populaire</Badge>
                                )}
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
                  ))}
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
