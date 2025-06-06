import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Heart, Eye } from "lucide-react";
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
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});

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
        return "custom"; // Changed from "sushi" to "custom"
      }
    }
    
    // Also check by category for custom products
    if (item.category === "custom" || item.category === "poke_custom") {
      return item.category === "poke_custom" ? "poke" : "custom"; // Changed from "sushi" to "custom"
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

  const toggleItemDetails = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
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

      <div className="space-y-4">
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
                <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 bg-white rounded-xl">
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      {/* Image à gauche */}
                      <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden rounded-l-xl">
                        {item.imageUrl && item.imageUrl !== "/placeholder.svg" ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(item.imageUrl, item.name)}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Pas d'image</span>
                          </div>
                        )}
                        
                        {/* Icône cœur en overlay */}
                        <div className="absolute top-3 left-3">
                          <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                            <Heart className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Contenu principal */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* Badges */}
                            <div className="flex gap-2 mb-2">
                              {item.category && (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-pink-100 text-pink-600 border-0 text-xs font-medium uppercase tracking-wider"
                                >
                                  {item.category === "poke" ? "POKE BOWL" : 
                                   item.category === "custom" ? "SUSHI" :
                                   item.category === "maki" ? "MAKI" :
                                   item.category === "plateaux" ? "PLATEAU" :
                                   item.category}
                                </Badge>
                              )}
                              {item.isBestSeller && (
                                <Badge className="bg-gold-600 text-white text-xs">
                                  Populaire
                                </Badge>
                              )}
                              {item.isVegetarian && (
                                <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                                  Végétarien
                                </Badge>
                              )}
                            </div>

                            {/* Titre et bouton œil */}
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.name}
                              </h3>
                              {item.description && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleItemDetails(item.id)}
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                >
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </Button>
                              )}
                            </div>
                            
                            {/* Description (conditionnellement affichée) */}
                            <AnimatePresence>
                              {item.description && expandedItems[item.id] && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <p className="text-gray-600 text-sm leading-relaxed mb-2">
                                    {item.description}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            {/* Allergènes */}
                            {item.allergens && expandedItems[item.id] && (
                              <p className="text-xs text-gray-500 mt-2">
                                Allergènes: {item.allergens}
                              </p>
                            )}
                          </div>

                          {/* Prix et bouton à droite */}
                          <div className="flex flex-col items-end ml-6">
                            <span className="text-lg font-bold text-gray-900 mb-4">
                              {item.price.toFixed(2)}€
                            </span>
                            
                            <div className="relative">
                              {isCustomProduct(item) ? (
                                <Button
                                  asChild
                                  className="bg-gold-500 hover:bg-gold-600 text-black rounded-full px-6"
                                  size="sm"
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
                                      className="bg-gold-500 hover:bg-gold-600 text-black rounded-full px-6"
                                      size="sm"
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
