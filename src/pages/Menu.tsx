
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Menu = () => {
  const categories = [
    {
      id: "sushi",
      name: "Sushi & Sashimi",
      items: [
        {
          id: 1,
          name: "Assortiment de Sushi",
          description: "8 pièces variées de nos meilleurs sushi",
          price: 14.90,
          isPopular: true,
          imageUrl: "/lovable-uploads/0f3ef4af-3737-45b0-a552-0c84028dd3cd.png"
        },
        {
          id: 2,
          name: "Sashimi de Saumon",
          description: "Tranches fines de saumon frais",
          price: 12.50,
          isPopular: false,
          imageUrl: "/lovable-uploads/8d6a0ad3-bf3f-48f8-b427-7d4db8f4b26b.png"
        },
        {
          id: 3,
          name: "California Roll",
          description: "Avocat, crabe, concombre et tobiko",
          price: 10.90,
          isPopular: true,
          imageUrl: "/lovable-uploads/410b6967-e49b-4913-9f13-24e5279ee4f5.png"
        }
      ]
    },
    {
      id: "plats",
      name: "Plats Chauds",
      items: [
        {
          id: 4,
          name: "Ramen au Porc",
          description: "Nouilles dans un bouillon riche avec porc chashu",
          price: 16.90,
          isPopular: true,
          imageUrl: "/lovable-uploads/c30dd633-dfec-4589-afdf-9cf0abf72049.png"
        },
        {
          id: 5,
          name: "Yakitori",
          description: "Brochettes de poulet grillées à la sauce teriyaki",
          price: 9.50,
          isPopular: false,
          imageUrl: "/lovable-uploads/ab0cbaa4-7dab-449d-b422-e426b7812e41.png"
        }
      ]
    },
    {
      id: "desserts",
      name: "Desserts",
      items: [
        {
          id: 6,
          name: "Mochi Glacé",
          description: "Boules de glace enrobées de pâte de riz",
          price: 6.90,
          isPopular: false,
          imageUrl: "/lovable-uploads/2443ae61-1e76-42ea-a1fd-0506bb67f970.png"
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Notre Menu</h1>
        <p className="text-gray-600 text-center mb-12">
          Découvrez nos spécialités japonaises préparées avec soin
        </p>

        {categories.map((category) => (
          <div key={category.id} className="mb-16">
            <h2 className="text-2xl font-bold mb-6">{category.name}</h2>
            <Separator className="mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {category.items.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/3 h-48 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-full md:w-2/3 p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold">{item.name}</h3>
                          <span className="font-semibold text-akane-600">
                            {item.price.toFixed(2)} €
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                        {item.isPopular && <Badge className="bg-akane-600">Populaire</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Menu;
