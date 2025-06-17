
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye } from "lucide-react";
import { MenuItem, MenuCategory } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface MenuCategoryContentProps {
  category: MenuCategory;
}

const MenuCategoryContent = ({ category }: MenuCategoryContentProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const [selectedProductDetails, setSelectedProductDetails] = useState<MenuItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  const isMobile = useIsMobile();

  // Filtrer les éléments pour ne montrer que ceux qui sont actifs (is_new = true)
  const activeItems = category.items.filter(item => item.isNew !== false);

  const handleImageClick = (imageUrl: string, alt: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageAlt(alt);
  };

  const handleShowDetails = (item: MenuItem) => {
    setSelectedProductDetails(item);
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
  };

  const handleCloseDetails = () => {
    setSelectedProductDetails(null);
  };

  const toggleItemDetails = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <>
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

        <div className={isMobile ? "grid grid-cols-2 gap-3" : "space-y-4"}>
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
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 bg-white rounded-xl h-full">
                    <CardContent className="p-0 h-full">
                      {isMobile ? (
                        // Mobile layout - Vertical card
                        <div className="flex flex-col h-full">
                          {/* Image */}
                          <div className="w-full h-40 flex-shrink-0 relative overflow-hidden rounded-t-xl">
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
                            <div className="absolute top-2 left-2">
                              <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                                <Heart className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          </div>

                          {/* Contenu */}
                          <div className="p-3 flex flex-col flex-1">
                            {/* Badges */}
                            <div className="flex gap-1 mb-2 flex-wrap">
                              {item.category && (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-pink-100 text-pink-600 border-0 text-xs font-medium uppercase tracking-wider"
                                >
                                  {item.category === "poke" ? "POKE" : 
                                   item.category === "custom" ? "SUSHI" :
                                   item.category === "maki" ? "MAKI" :
                                   item.category === "plateaux" ? "PLATEAU" :
                                   item.category}
                                </Badge>
                              )}
                              {item.isVegetarian && (
                                <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                                  Végétarien
                                </Badge>
                              )}
                              {item.isSpicy && (
                                <Badge variant="outline" className="border-red-500 text-red-700 text-xs">
                                  Épicé
                                </Badge>
                              )}
                              {item.isGlutenFree && (
                                <Badge variant="glutenfree" className="text-xs">
                                  Sans gluten
                                </Badge>
                              )}
                            </div>

                            {/* Titre et bouton œil */}
                            <div className="flex items-start gap-1 mb-2">
                              <h3 className="text-sm font-semibold text-gray-900 leading-tight flex-1">
                                {item.name}
                              </h3>
                              {item.description && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleShowDetails(item)}
                                  className="h-5 w-5 p-0 hover:bg-gray-100 flex-shrink-0"
                                >
                                  <Eye className="h-3 w-3 text-gray-500" />
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
                                  <p className="text-gray-600 text-xs leading-relaxed mb-2">
                                    {item.description}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            
                            {/* Prix - En bas de la carte */}
                            <div className="mt-auto">
                              <span className="text-sm font-bold text-gray-900">
                                {item.price.toFixed(2)}€
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Desktop layout - Horizontal card
                        <div className="flex items-center">
                          {/* Image */}
                          <div className="w-40 h-40 flex-shrink-0 relative overflow-hidden rounded-l-xl">
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
                                <div className="flex gap-2 mb-2 flex-wrap">
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
                                  {item.isSpicy && (
                                    <Badge variant="outline" className="border-red-500 text-red-700 text-xs">
                                      Épicé
                                    </Badge>
                                  )}
                                  {item.isGlutenFree && (
                                    <Badge variant="glutenfree" className="text-xs">
                                      Sans gluten
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
                                      onClick={() => handleShowDetails(item)}
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

                              {/* Prix */}
                              <div className="flex flex-col items-end ml-6">
                                <span className="text-lg font-bold text-gray-900">
                                  {item.price.toFixed(2)}€
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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
      </motion.div>

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

      {/* Modal de détails du produit */}
      <Dialog open={!!selectedProductDetails} onOpenChange={handleCloseDetails}>
        <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">Détails de {selectedProductDetails?.name}</DialogTitle>
          {selectedProductDetails && (
            <div className="bg-white rounded-xl overflow-hidden">
              {/* Détails du produit au-dessus */}
              <div className="p-6 bg-white">
                <div className="mb-4">
                  {selectedProductDetails.category && (
                    <Badge 
                      variant="secondary" 
                      className="bg-pink-100 text-pink-600 border-0 text-sm font-medium uppercase tracking-wider mb-2"
                    >
                      {selectedProductDetails.category === "poke" ? "POKE BOWL" : 
                       selectedProductDetails.category === "custom" ? "SUSHI" :
                       selectedProductDetails.category === "maki" ? "MAKI" :
                       selectedProductDetails.category === "plateaux" ? "PLATEAU" :
                       selectedProductDetails.category}
                    </Badge>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedProductDetails.name}
                  </h2>
                  <div className="text-xl font-bold text-gold-600 mb-4">
                    {selectedProductDetails.price.toFixed(2)}€
                  </div>
                </div>
                
                {selectedProductDetails.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed text-base">
                      {selectedProductDetails.description}
                    </p>
                  </div>
                )}
                
                {selectedProductDetails.allergens && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Allergènes: </span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedProductDetails.allergens}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Image agrandie */}
              <div className="w-full">
                {selectedProductDetails.imageUrl && selectedProductDetails.imageUrl !== "/placeholder.svg" ? (
                  <img
                    src={selectedProductDetails.imageUrl}
                    alt={selectedProductDetails.name}
                    className="w-full h-auto object-contain max-h-[60vh]"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">Pas d'image disponible</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MenuCategoryContent;
