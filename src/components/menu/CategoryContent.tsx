
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { MenuItem, MenuCategory } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface CategoryContentProps {
  category: MenuCategory;
  onAddToCart: (item: MenuItem) => void;
}

const CategoryContent = ({ category, onAddToCart }: CategoryContentProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");

  // Check if an item is a custom product (sushi or poke)
  const isCustomProduct = (item: MenuItem) => {
    // Check product name for custom product keywords
    if (item.name.toLowerCase().includes("poke crea") || 
        item.name.toLowerCase().includes("poké crea") || 
        item.name.toLowerCase().includes("poké créa") ||
        item.name.toLowerCase().includes("sushi crea") || 
        item.name.toLowerCase().includes("sushi créa") || 
        item.name.toLowerCase().includes("compose")) {
      
      // Determine if it's a poke bowl or sushi
      if (item.name.toLowerCase().includes("poke") || 
          item.name.toLowerCase().includes("poké")) {
        return "poke";
      } else {
        return "sushi";
      }
    }
    
    // Also check by category for custom products
    if (item.category === "custom" || item.category === "poke_custom") {
      return item.category === "poke_custom" ? "poke" : "sushi";
    }
    
    return false;
  };

  const handleImageClick = (imageUrl: string, alt: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageAlt(alt);
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
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
                      <div className="w-full md:w-1/4 overflow-hidden bg-[#f9fafb]">
                        <div className="max-w-[120px] md:max-w-full mx-auto">
                          <AspectRatio ratio={1/1} className="bg-[#f9fafb]">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleImageClick(item.imageUrl, item.name)}
                            />
                          </AspectRatio>
                        </div>
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

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-0 shadow-none">
          {/* Titre caché pour accessibilité */}
          <DialogTitle className="sr-only">Image de {selectedImageAlt}</DialogTitle>
          <div className="w-full bg-[#f9fafb] rounded-lg overflow-hidden">
            <img
              src={selectedImage || ''}
              alt={selectedImageAlt}
              className="w-full h-auto object-contain max-h-[80vh]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CategoryContent;
