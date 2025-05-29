
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
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  // Filtrer les éléments pour ne montrer que ceux qui sont actifs (is_new = true)
  const activeItems = category.items.filter(item => item.isNew !== false);

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
      } else if (item.category === "custom" || 
                item.name.toLowerCase().includes("sushi")) {
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

  const handleAddToCart = (item: MenuItem) => {
    setClickedButton(item.id);
    onAddToCart(item);
    
    // Reset animation after 600ms to allow the +1 message to fade out
    setTimeout(() => {
      setClickedButton(null);
    }, 600);
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
          {activeItems.length > 0 ? (
            activeItems.map((item, index) => (
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
                        <div 
                          className="w-full md:w-1/4 flex items-center justify-center"
                          style={{ backgroundColor: '#c7c8ca' }}
                        >
                          <div className="w-full max-w-[120px] md:max-w-none mx-auto py-4 px-2">
                            <div className="aspect-square relative">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(item.imageUrl, item.name)}
                              />
                            </div>
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
                        <div className="flex justify-end mt-4 relative">
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
                            <div className="relative">
                              <motion.div
                                animate={clickedButton === item.id ? {
                                  scale: [1, 0.95, 1.05, 1],
                                  transition: { duration: 0.3, ease: "easeInOut" }
                                } : {}}
                              >
                                <Button
                                  onClick={() => handleAddToCart(item)}
                                  className="bg-gold-500 hover:bg-gold-600 text-black"
                                >
                                  <Plus className="mr-2 h-4 w-4" /> Ajouter
                                </Button>
                              </motion.div>
                              
                              {/* +1 Message Animation */}
                              <AnimatePresence>
                                {clickedButton === item.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                    animate={{ 
                                      opacity: 1, 
                                      y: -20, 
                                      scale: 1,
                                      transition: { duration: 0.2, ease: "easeOut" }
                                    }}
                                    exit={{ 
                                      opacity: 0, 
                                      y: -30,
                                      transition: { duration: 0.3, ease: "easeIn" }
                                    }}
                                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gold-500 text-black px-2 py-1 rounded-full text-sm font-bold shadow-lg z-10"
                                  >
                                    +1
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Aucun produit disponible dans cette catégorie</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Image Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">Image de {selectedImageAlt}</DialogTitle>
          <div 
            className="w-full rounded-lg overflow-hidden"
            style={{ backgroundColor: '#c7c8ca' }}
          >
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
