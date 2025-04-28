
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { MenuItem, MenuCategory } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

interface CategoryContentProps {
  category: MenuCategory;
  onAddToCart: (item: MenuItem) => void;
}

const CategoryContent = ({ category, onAddToCart }: CategoryContentProps) => {
  // Check if an item is a custom product (sushi or poke)
  const isCustomProduct = (item: MenuItem) => {
    // Check if it's a custom sushi product
    if (item.name.toLowerCase().includes("poke crea") || 
        item.name.toLowerCase().includes("sushi créa") ||
        item.name.toLowerCase().includes("compose")) {
      
      // Determine if it's a poke bowl or sushi
      if (item.name.toLowerCase().includes("poke")) {
        return "poke";
      } else {
        return "sushi";
      }
    }
    
    return false;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
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
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {item.imageUrl && item.imageUrl !== "/placeholder.svg" && (
                      <div className="w-full md:w-1/4 h-32 md:h-40 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={`w-full ${
                        item.imageUrl && item.imageUrl !== "/placeholder.svg"
                          ? "md:w-3/4"
                          : ""
                      } p-6 flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-bold">{item.name}</h3>
                            {item.description && (
                              <p className="text-gray-600 text-sm mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-gold-600">
                              {item.price.toFixed(2)} €
                            </span>
                            {item.isBestSeller && (
                              <Badge className="bg-gold-600 mt-2">
                                Populaire
                              </Badge>
                            )}
                            {item.isVegetarian && (
                              <Badge variant="outline" className="mt-2 border-wasabi-500 text-wasabi-700">
                                Végétarien
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.allergens && (
                          <p className="text-xs text-gray-500 mt-2">
                            Allergènes: {item.allergens}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end mt-4">
                        {isCustomProduct(item) ? (
                          <Button
                            asChild
                            className="bg-gold-500 hover:bg-gold-600 text-black"
                          >
                            <Link 
                              to={isCustomProduct(item) === "poke" ? "/composer-poke" : "/composer-sushi"} 
                              state={{ baseItem: item }}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Composer
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => onAddToCart(item)}
                            className="bg-gold-500 hover:bg-gold-600 text-black"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Ajouter
                          </Button>
                        )}
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
  );
};

export default CategoryContent;
