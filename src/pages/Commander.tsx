
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  // Using the complete menu data structure with all categories and items
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
          description: "50 pièces variées pour 3-4 personnes incluant 6 Maki Saumon Cheese, 6 California Caesar, 6 California Chèvre miel, 6 Crispy roll Crevette Tempura Avocat spicy, 6 Spring roll Poulet Tempura spicy, 6 Rainbow roll, 6 Green Avocado Saumon Concombre, 2 Gunkan Œufs de Tobiko, 3 Nigiri Saumon, 3 Nigiri Crevette Tempura",
          price: 55.90,
          isPopular: true,
          category: "plateaux",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "plat5",
          name: "LE ROYAL",
          description: "60 pièces variées pour 4-5 personnes incluant 6 Maki Saumon, 6 California Chèvre Miel, 6 California Frenchy, 6 California Cheddar roll, 6 Crispy roll Saumon Avocat Cheese, 6 Spring roll Thon Avocat Concombre, 6 Salmon roll Cheese spicy snacké, 6 Green Avocado Poulet Tempura Avocat spicy, 2 Nigiri Thon Spicy Tobiko, 2 Nigiri Daurade, 2 Gunkan Saumon, 6 Crispy roll Thon Cuit Avocat",
          price: 75.90,
          isPopular: false,
          category: "plateaux",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "plat6",
          name: "LE GOURMAND",
          description: "42 pièces variées pour 2-3 personnes incluant 6 Maki Crevette Avocat, 6 Maki Thon, 6 California Frenchy, 6 Crispy roll Poulet Tempura, 6 Spring roll Saumon Avocat Concombre, 6 Salmon roll Cheese, 3 Nigiri Saumon Cheese, 3 Nigiri Thon",
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
      id: "gunkan",
      name: "Gunkan",
      description: "Riz & garniture entouré d'algue nori (2 pièces)",
      items: [
        {
          id: "gun1",
          name: "Saumon",
          price: 5.90,
          isPopular: true,
          category: "gunkan",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "gun2",
          name: "Thon",
          price: 6.50,
          isPopular: false,
          category: "gunkan",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "gun3",
          name: "Œufs de Tobiko",
          price: 6.50,
          isPopular: false,
          category: "gunkan",
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
      id: "poke",
      name: "Poke Bowl",
      description: "Bol composé de riz, protéines, légumes et sauce",
      items: [
        {
          id: "poke1",
          name: "Poké Saumon",
          price: 14.90,
          isPopular: true,
          category: "poke",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "poke2",
          name: "Poké Poulet Tempura",
          price: 13.90,
          isPopular: true,
          category: "poke",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "poke3",
          name: "Poké Créa",
          description: "Personnalisez votre poké bowl avec: Riz Vinaigré, 5 ingrédients max (Carotte, Radis, Concombre, Edamame, Avocat, Chou rouge, Algue wakamé, Mangue, Cheese), 1 protéine (Saumon, Saumon Tataki, Thon, Thon Tataki, Crevette Tempura, Poulet, Tofu), 1 sauce (Soja Sucrée, Soja Salée, Spicy Mayo, Caesar, Teriyaki)",
          price: 14.90,
          isPopular: false,
          category: "poke",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "poke4",
          name: "Poké Veggie",
          price: 12.90,
          isPopular: false,
          category: "poke",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "poke5",
          name: "Supplément",
          price: 1.00,
          isPopular: false,
          category: "poke",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "chirashi",
      name: "Chirashi",
      description: "Riz surmonté de lamelles de protéine",
      items: [
        {
          id: "chir1",
          name: "Fusion",
          price: 17.50,
          isPopular: false,
          category: "chirashi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "chir2",
          name: "Saumon",
          price: 15.90,
          isPopular: true,
          category: "chirashi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "chir3",
          name: "Saumon Avocat",
          price: 16.50,
          isPopular: false,
          category: "chirashi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "chir4",
          name: "Saumon Tataki",
          price: 16.90,
          isPopular: false,
          category: "chirashi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "chir5",
          name: "Poulet Tempura",
          price: 16.90,
          isPopular: true,
          category: "chirashi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "chir6",
          name: "Thon",
          price: 16.90,
          isPopular: false,
          category: "chirashi",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "chir7",
          name: "Thon Avocat",
          price: 17.50,
          isPopular: false,
          category: "chirashi",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "maki",
      name: "Maki",
      description: "Rouleau d'algue nori, riz vinaigré et garniture (6 pièces)",
      items: [
        {
          id: "maki1",
          name: "Saumon",
          price: 5.60,
          isPopular: true,
          category: "maki",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "maki2",
          name: "Saumon Cheese",
          price: 5.90,
          isPopular: false,
          category: "maki",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "maki3",
          name: "Thon",
          price: 5.90,
          isPopular: false,
          category: "maki",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "maki4",
          name: "Crevette Avocat",
          price: 5.90,
          isPopular: false,
          category: "maki",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "maki5",
          name: "Avocat Concombre Carotte",
          price: 5.60,
          isPopular: false,
          category: "maki",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "maki6",
          name: "Concombre Cheese",
          price: 5.50,
          isPopular: false,
          category: "maki",
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
      id: "crispy",
      name: "Crispy Roll",
      description: "Rouleau inversé, riz à l'extérieur garni d'oignon frit (6 pièces)",
      items: [
        {
          id: "crispy1",
          name: "Saumon Avocat Cheese",
          price: 6.50,
          isPopular: true,
          category: "crispy",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "crispy2",
          name: "Poulet Tempura Avocat Spicy",
          price: 7.10,
          isPopular: true,
          category: "crispy",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "crispy3",
          name: "Thon Cuit Avocat",
          price: 5.90,
          isPopular: false,
          category: "crispy",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "crispy4",
          name: "Crevette Concombre",
          price: 6.90,
          isPopular: false,
          category: "crispy",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "crispy5",
          name: "Crevette Tempura Avocat Spicy",
          price: 7.20,
          isPopular: true,
          category: "crispy",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "crispy6",
          name: "Concombre Avocat Cheese",
          price: 5.90,
          isPopular: false,
          category: "crispy",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "spring",
      name: "Spring Roll",
      description: "Rouleau frais entouré de feuille de riz (6 pièces)",
      items: [
        {
          id: "spring1",
          name: "Saumon Avocat Concombre",
          price: 7.10,
          isPopular: true,
          category: "spring",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "spring2",
          name: "Thon Avocat Concombre",
          price: 7.20,
          isPopular: false,
          category: "spring",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "spring3",
          name: "Crevette Avocat Menthe",
          price: 7.20,
          isPopular: false,
          category: "spring",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "spring4",
          name: "Crevette Tempura Concombre Avocat",
          price: 7.70,
          isPopular: true,
          category: "spring",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "spring5",
          name: "Poulet Tempura Spicy",
          price: 6.90,
          isPopular: false,
          category: "spring",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "spring6",
          name: "Poulet Curry Avocat",
          price: 6.90,
          isPopular: false,
          category: "spring",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "spring7",
          name: "Avocat Cheese",
          price: 5.90,
          isPopular: false,
          category: "spring",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "spring8",
          name: "Concombre Cheese",
          price: 5.90,
          isPopular: false,
          category: "spring",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "salmon",
      name: "Salmon Roll",
      description: "Rouleau enrobé de saumon (6 pièces)",
      items: [
        {
          id: "salmon1",
          name: "Cheese",
          price: 7.60,
          isPopular: true,
          category: "salmon",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "salmon2",
          name: "Cheese Spicy Snacké",
          price: 7.80,
          isPopular: false,
          category: "salmon",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "salmon3",
          name: "Concombre Cheese",
          price: 7.70,
          isPopular: false,
          category: "salmon",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "salmon4",
          name: "Avocat Cheese",
          price: 7.90,
          isPopular: true,
          category: "salmon",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "green",
      name: "Green Avocado",
      description: "Rouleau enrobé d'avocat (6 pièces)",
      items: [
        {
          id: "green1",
          name: "Saumon Concombre Cheese",
          price: 8.10,
          isPopular: true,
          category: "green",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "green2",
          name: "Thon Concombre Avocat",
          price: 8.20,
          isPopular: false,
          category: "green",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "green3",
          name: "Saumon Concombre",
          price: 7.90,
          isPopular: false,
          category: "green",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "green4",
          name: "Crevette Tempura Avocat Concombre Spicy",
          price: 9.50,
          isPopular: true,
          category: "green",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "green5",
          name: "Concombre Avocat Carotte Cheese",
          price: 6.50,
          isPopular: false,
          category: "green",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "green6",
          name: "Poulet Tempura Avocat Spicy",
          price: 8.20,
          isPopular: false,
          category: "green",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "nigiri",
      name: "Nigiri",
      description: "Boule de riz vinaigré surmontée d'une tranche de poisson (2 pièces)",
      items: [
        {
          id: "nigiri1",
          name: "Saumon",
          price: 4.50,
          isPopular: true,
          category: "nigiri",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "nigiri2",
          name: "Saumon Cheese",
          price: 4.90,
          isPopular: false,
          category: "nigiri",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "nigiri3",
          name: "Saumon Tataki",
          price: 4.70,
          isPopular: false,
          category: "nigiri",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "nigiri4",
          name: "Daurade",
          price: 5.50,
          isPopular: false,
          category: "nigiri",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "nigiri5",
          name: "Thon Spicy Tobiko",
          price: 5.50,
          isPopular: true,
          category: "nigiri",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "nigiri6",
          name: "Thon",
          price: 5.30,
          isPopular: false,
          category: "nigiri",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "nigiri7",
          name: "Crevette",
          price: 4.90,
          isPopular: false,
          category: "nigiri",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "nigiri8",
          name: "Crevette Tempura",
          price: 6.50,
          isPopular: true,
          category: "nigiri",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "signature",
      name: "Signature",
      description: "Les sushis by Sushieats",
      items: [
        {
          id: "sig1",
          name: "Rainbow Roll",
          description: "California Crevette Tempura recouvert d'une tranche de Saumon, Thon, Avocat (6 pièces)",
          price: 10.20,
          isPopular: true,
          category: "signature",
          imageUrl: "/lovable-uploads/0f3ef4af-3737-45b0-a552-0c84028dd3cd.png"
        },
        {
          id: "sig2",
          name: "Triangle Saumon",
          description: "Avocat Tobiko (6 pièces)",
          price: 9.90,
          isPopular: false,
          category: "signature",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "sig3",
          name: "Cheddar Roll",
          description: "California Poulet Tempura recouvert de tranche de Cheddar (6 pièces)",
          price: 7.90,
          isPopular: true,
          category: "signature",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "sig4",
          name: "Donuts Nigiri",
          description: "Saumon Avocat Cheese (1 pièce)",
          price: 8.50,
          isPopular: false,
          category: "signature",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "sig5",
          name: "Brie Truffé",
          description: "California Brie Truffé et Noix (6 pièces)",
          price: 13.90,
          isPopular: true,
          category: "signature",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "sig6",
          name: "Tempura Curry",
          description: "California Crevette Tempura Curry Tobiko (6 pièces)",
          price: 8.20,
          isPopular: false,
          category: "signature",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "temaki",
      name: "Temaki Twist",
      description: "Cône d'algue nori garni (1 Cône)",
      items: [
        {
          id: "tem1",
          name: "Saumon Avocat Concombre Tobiko",
          price: 5.50,
          isPopular: true,
          category: "temaki",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "tem2",
          name: "Thon Avocat Concombre Tobiko",
          price: 5.90,
          isPopular: false,
          category: "temaki",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "tem3",
          name: "Poulet Avocat Concombre Tobiko",
          price: 5.50,
          isPopular: false,
          category: "temaki",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "tem4",
          name: "Crevette Avocat Concombre Tobiko",
          price: 6.20,
          isPopular: true,
          category: "temaki",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "maki_wrap",
      name: "Maki Wrap",
      description: "Wrap de sushi Maki, roulé d'algue nori avec riz vinaigré et garniture (2 pièces)",
      items: [
        {
          id: "wrap1",
          name: "Thon Avocat Concombre",
          price: 6.50,
          isPopular: false,
          category: "maki_wrap",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "wrap2",
          name: "Saumon Avocat Cheese",
          price: 6.20,
          isPopular: true,
          category: "maki_wrap",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "wrap3",
          name: "Crevette Avocat Concombre",
          price: 6.50,
          isPopular: false,
          category: "maki_wrap",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "wrap4",
          name: "Poulet Tempura Avocat",
          price: 6.60,
          isPopular: true,
          category: "maki_wrap",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "wrap5",
          name: "Avocat Concombre Carotte",
          price: 5.90,
          isPopular: false,
          category: "maki_wrap",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "wrap6",
          name: "Crevette Tempura Avocat",
          price: 6.90,
          isPopular: false,
          category: "maki_wrap",
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
        },
        {
          id: "des7",
          name: "Perle du Japon",
          description: "Mangue, Ananas, Banane",
          price: 5.50,
          isPopular: false,
          category: "desserts",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "des8",
          name: "Mochi",
          description: "2 pièces (Vanille/Citron Yuzu/Chocolat/Fleur de Cerisier/Thé vert/Mangue/Passion)",
          price: 5.20,
          isPopular: true,
          category: "desserts",
          imageUrl: "/placeholder.svg"
        }
      ]
    },
    {
      id: "boissons",
      name: "Boissons",
      items: [
        {
          id: "drink1",
          name: "Eau plate/eau gazeuse",
          description: "33cl",
          price: 2.50,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink2",
          name: "Coca-Cola/Coca-Cola sans sucre",
          description: "33cl",
          price: 2.50,
          isPopular: true,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink3",
          name: "Coca-Cola Cherry",
          description: "33cl",
          price: 2.50,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink4",
          name: "Orangina",
          description: "33cl",
          price: 2.50,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink5",
          name: "Fuzetea thé noir pêche",
          description: "33cl",
          price: 2.50,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink6",
          name: "Fuzetea thé vert glacé, citron vert",
          description: "33cl",
          price: 2.50,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink7",
          name: "Oasis tropical",
          description: "33cl",
          price: 2.50,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink8",
          name: "Mangajo: Thé vert & Baie d'açaí, Citron & thé vert",
          description: "25cl",
          price: 3.50,
          isPopular: true,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink9",
          name: "Ginger beer",
          description: "27,5cl",
          price: 3.90,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink10",
          name: "Limonade japonaise litchi",
          description: "22cl",
          price: 3.50,
          isPopular: true,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink11",
          name: "Kirin Ichiban",
          description: "Bière Japonaise 33cl",
          price: 4.00,
          isPopular: true,
          category: "boissons",
          imageUrl: "/placeholder.svg"
        },
        {
          id: "drink12",
          name: "IGP Alpilles Rouge Bio",
          description: "Domaine des Blaquières",
          price: 34.00,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg",
          variant: "bottle"
        },
        {
          id: "drink13",
          name: "IGP Alpilles Rosé Bio",
          description: "Domaine des Blaquières",
          price: 32.00,
          isPopular: true,
          category: "boissons",
          imageUrl: "/placeholder.svg",
          variant: "bottle"
        },
        {
          id: "drink14",
          name: "IGP Alpilles Blanc Bio",
          description: "Domaine des Blaquières",
          price: 48.00,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg",
          variant: "bottle"
        },
        {
          id: "drink15",
          name: "Blanc moelleux",
          description: "Sélection du moment",
          price: 16.00,
          isPopular: false,
          category: "boissons",
          imageUrl: "/placeholder.svg",
          variant: "bottle"
        },
        {
          id: "drink16",
          name: "Takara",
          description: "Vins Liquoreux aux abricots du Japon",
          price: 30.00,
          isPopular: true,
          category: "boissons",
          imageUrl: "/placeholder.svg",
          variant: "bottle"
        },
        {
          id: "drink17",
          name: "Saké",
          description: "Daiginjo l'Atelier du Saké",
          price: 35.00,
          isPopular: true,
          category: "boissons",
          imageUrl: "/placeholder.svg",
          variant: "bottle"
        },
        {
          id: "drink18",
          name: "Café",
          price: 2.00,
          isPopular: false,
          category: "boissons",
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
                                <Badge className="bg-akane-600">
                                  {item.variant === "bottle" 
                                    ? `${item.price.toFixed(2)} € (bouteille)` 
                                    : `${item.price.toFixed(2)} €`}
                                </Badge>
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

