import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Heart, Eye, Gift } from "lucide-react";
import { MenuItem, MenuCategory } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateProductImageUrl, generateProductImageAlt } from "@/utils/productImageUtils";
import { useBoxAccompagnement } from "@/hooks/useBoxAccompagnement";
import { AccompagnementSelector } from "@/components/AccompagnementSelector";
import { useToast } from "@/hooks/use-toast";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { useDessertBoissonOffer } from "@/hooks/useDessertBoissonOffer";
import { useWrapSelection } from "@/hooks/useWrapSelection";
import { WrapSelectionModal } from "./WrapSelectionModal";
import { WineFormatSelector } from "./WineFormatSelector";
import { useSpecialEvents } from "@/hooks/useSpecialEvents";
import { useCartEventProducts } from "@/hooks/useCartEventProducts";
import { useEventFreeDesserts } from "@/hooks/useEventFreeDesserts";

interface CategoryContentProps {
  category: MenuCategory;
  onAddToCart: (item: MenuItem) => void;
}

const CategoryContent = ({ category, onAddToCart }: CategoryContentProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
  const [selectedProductDetails, setSelectedProductDetails] = useState<MenuItem | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();
  const { isEventProduct } = useSpecialEvents(currentRestaurant?.id);
  const cartEventInfo = useCartEventProducts(currentRestaurant?.id);
  const { eventProductsCount, customFreeDessertId } = useEventFreeDesserts(currentRestaurant?.id);
  
  // Vérifier si un item dessert doit avoir son prix à 0€
  const isDessertCategory = (categoryId: string) => categoryId?.toLowerCase().includes('dessert');
  const isBoissonCategory = (categoryId: string) => categoryId?.toLowerCase().includes('boisson');
  
  // Fonction pour vérifier si un produit spécifique doit afficher le prix gratuit
  const shouldShowFreeDessertPriceForItem = (itemId: string) => {
    if (!isDessertCategory(category.id) || isBoissonCategory(category.id)) return false;
    if (!cartEventInfo.freeDessertsEnabled || !cartEventInfo.hasEventProducts || eventProductsCount <= 0) return false;
    
    // Si un dessert personnalisé est défini, seul ce produit affiche le prix gratuit
    if (customFreeDessertId) {
      return itemId === customFreeDessertId;
    }
    
    // Sinon, tous les desserts peuvent être offerts
    return true;
  };
  
  // Vérifier si c'est après 14h
  const isAfter2PM = () => {
    const now = new Date();
    return now.getHours() >= 14;
  };
  
  // Vérifier si c'est une catégorie box du midi
  const isBoxDuMidi = (category: MenuCategory) => {
    return category.name.toLowerCase().includes('box') && 
           category.name.toLowerCase().includes('midi');
  };
  
  const {
    showAccompagnementSelector,
    handleAddToCart: handleBoxAddToCart,
    handleAccompagnementSelected,
    handleCloseAccompagnementSelector,
    pendingBoxItem
  } = useBoxAccompagnement();

  // Utiliser le contexte global pour l'offre dessert/boisson
  const { dessertBoissonOfferActive } = useDessertBoissonOffer();
  const { 
    isWrapModalOpen, 
    pendingWrapBoxItem, 
    handleAddToCartWithWrapSelection, 
    handleWrapSelected: originalHandleWrapSelected, 
    handleWrapSelectionCancel 
  } = useWrapSelection();

  // Fonction personnalisée pour gérer la sélection de wrap et déclencher les accompagnements
  const handleWrapSelected = (selectedWrap: MenuItem) => {
    const customWrapBoxItem = originalHandleWrapSelected(selectedWrap);
    if (customWrapBoxItem) {
      // Déclencher la modale des accompagnements gratuits
      console.log("🟨 Déclenchement de la modale des accompagnements gratuits...");
      handleBoxAddToCart(customWrapBoxItem, 1);
    }
  };

  // Vins blancs spécifiques qui doivent avoir un sélecteur de format
  const WINE_VARIANTS = [
    "Vin Blanc Uby N°4",
    "Vin Blanc La Vallongue LES CALANS",
    "Vin Blanc Domaine des Blaquières l'Ugni de Nelly"
  ];

  // Fonction pour détecter si un produit est un vin avec format
  const getWineBaseName = (name: string): string | null => {
    for (const wineName of WINE_VARIANTS) {
      if (name.includes(wineName)) {
        return wineName;
      }
    }
    return null;
  };

  // Grouper les vins par format
  const groupWinesByFormat = (items: MenuItem[]) => {
    const wineGroups = new Map<string, { verre?: MenuItem; bouteille?: MenuItem }>();
    const otherItems: MenuItem[] = [];

    items.forEach(item => {
      const baseName = getWineBaseName(item.name);
      if (baseName) {
        if (!wineGroups.has(baseName)) {
          wineGroups.set(baseName, {});
        }
        const group = wineGroups.get(baseName)!;
        if (item.name.includes('(Verre)')) {
          group.verre = item;
        } else if (item.name.includes('(Bouteille)')) {
          group.bouteille = item;
        }
      } else {
        otherItems.push(item);
      }
    });

    return { wineGroups, otherItems };
  };

  // Filtrer les éléments pour ne montrer que ceux qui sont actifs (is_new = true)
  const activeItems = category.items.filter(item => item.isNew !== false);
  
  // Grouper les vins par format
  const { wineGroups, otherItems } = groupWinesByFormat(activeItems);

  // Mapping des noms commerciaux pour les badges de catégories
  const categoryDisplayNames: Record<string, string> = {
    'box_du_midi': 'BOX MIDI',
    'plateaux': 'PLATEAU',
    'yakitori': 'YAKITORI',
    'gunkan': 'GUNKAN',
    'sashimi': 'SASHIMI',
    'poke': 'POKÉ BOWL',
    'chirashi': 'CHIRASHI',
    'maki': 'MAKI',
    'california': 'CALIFORNIA',
    'crispy': 'CRISPY',
    'spring': 'SPRING',
    'salmon': 'SALMON',
    'green': 'GREEN',
    'nigiri': 'NIGIRI',
    'signature': 'SIGNATURE',
    'temaki': 'TEMAKI',
    'maki_wrap': 'MAKI WRAP',
    'accompagnements': 'ACCOMPAGNEMENT',
    'desserts': 'DESSERT',
    'boissons': 'BOISSON',
    'custom': 'SUSHI CRÉATION',
    'poke_custom': 'POKÉ CRÉATION'
  };

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
        return "custom";
      }
    }
    
    // Also check by category for custom products
    if (item.category === "custom" || item.category === "poke_custom") {
      return item.category === "poke_custom" ? "poke" : "custom";
    }
    
    return false;
  };

  const isBoxItem = (item: MenuItem) => {
    return item.category === 'box' || 
           item.category === 'box_du_midi' || 
           item.category.toLowerCase().includes('box') ||
           item.name.toLowerCase().includes('box');
  };

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

  const handleAddToCart = (item: MenuItem) => {
    console.log("🟩 CategoryContent.handleAddToCart called with:", item.name);
    setClickedButton(item.id);
    
    // PRIORITÉ 1: Vérifier si c'est une Wrap Box et utiliser la sélection de wrap
    if (item.name.toLowerCase().includes('wrap box') || item.name.toLowerCase().includes('wrapbox')) {
      console.log("🟩 C'est une Wrap Box, ouvrir la modale de sélection");
      handleAddToCartWithWrapSelection(item, 1);
      return;
    }
    
    // PRIORITÉ 2: Vérifier si c'est une box normale
    if (isBoxItem(item)) {
      console.log("🟩 C'est une box, SEULEMENT le hook - PAS onAddToCart !");
      // Si c'est une box, utiliser SEULEMENT la logique du hook pour ouvrir le popup
      handleBoxAddToCart(item, 1);
      // IMPORTANT: Ne PAS appeler onAddToCart pour les box !
      return;
    } 
    
    console.log("🟩 Pas une box ni wrap box, appel de onAddToCart");
    // Sinon, ajouter directement au panier
    onAddToCart(item);
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
    
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
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full ${isBoxDuMidi(category) && isAfter2PM() ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h2 className={`text-2xl font-bold ${isBoxDuMidi(category) && isAfter2PM() ? 'text-gray-400' : ''}`}>
              {category.name}
            </h2>
            {isBoxDuMidi(category) && isAfter2PM() && (
              <span className="text-sm text-red-500 font-medium">
                (Disponible jusqu'à 14h)
              </span>
            )}
          </div>
          {category.description && (
            <p className={`italic mt-1 ${isBoxDuMidi(category) && isAfter2PM() ? 'text-gray-400' : 'text-gray-600'}`}>
              {category.description}
            </p>
          )}
          <Separator className="my-4" />
        </div>

        <div className={isMobile ? "grid grid-cols-2 gap-3" : "space-y-4"}>
          <AnimatePresence>
            {/* Afficher d'abord les vins groupés */}
            {Array.from(wineGroups.entries()).map(([baseName, { verre, bouteille }], index) => {
              if (!verre || !bouteille) return null;
              
              return (
                <motion.div
                  key={`wine-${baseName}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden transition-shadow border-0 rounded-xl h-full bg-white hover:shadow-lg">
                    <CardContent className="p-0 h-full">
                      {isMobile ? (
                        // Mobile layout
                        <div className="flex flex-col h-full">
                          <div className="w-full h-40 flex-shrink-0 relative overflow-hidden rounded-t-xl">
                            {verre.imageUrl && verre.imageUrl !== "/placeholder.svg" ? (
                              <img
                                src={generateProductImageUrl(verre.name, verre.imageUrl)}
                                alt={generateProductImageAlt(baseName)}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(generateProductImageUrl(verre.name, verre.imageUrl), baseName)}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Pas d'image</span>
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                              <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                                <Heart className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3 flex flex-col flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-3">
                              {baseName}
                            </h3>
                            <div className="mt-auto">
                              <WineFormatSelector
                                baseName={baseName}
                                verreProduct={verre}
                                bouteilleProduct={bouteille}
                                onAddToCart={onAddToCart}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Desktop layout
                        <div className="flex items-center">
                          <div className="w-40 h-40 flex-shrink-0 relative overflow-hidden rounded-l-xl">
                            {verre.imageUrl && verre.imageUrl !== "/placeholder.svg" ? (
                              <img
                                src={generateProductImageUrl(verre.name, verre.imageUrl)}
                                alt={generateProductImageAlt(baseName)}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(generateProductImageUrl(verre.name, verre.imageUrl), baseName)}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Pas d'image</span>
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                                <Heart className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              {baseName}
                            </h3>
                            <WineFormatSelector
                              baseName={baseName}
                              verreProduct={verre}
                              bouteilleProduct={bouteille}
                              onAddToCart={onAddToCart}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            
            {/* Afficher ensuite les autres produits */}
            {otherItems.length > 0 ? (
              otherItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className={`overflow-hidden transition-shadow rounded-xl h-full ${
                    isBoxDuMidi(category) && isAfter2PM() 
                      ? 'bg-gray-100 cursor-not-allowed border-0' 
                      : 'bg-white hover:shadow-lg'
                  } ${isEventProduct(item.id) ? 'border-2 border-red-500 ring-2 ring-red-200' : 'border-0'}`}>
                    <CardContent className="p-0 h-full">
                      {isMobile ? (
                        // Mobile layout - Vertical card
                        <div className="flex flex-col h-full">
                          {/* Image */}
                          <div className="w-full h-40 flex-shrink-0 relative overflow-hidden rounded-t-xl">
                            {item.imageUrl && item.imageUrl !== "/placeholder.svg" ? (
                              <img
                                src={generateProductImageUrl(item.name, item.imageUrl)}
                                alt={generateProductImageAlt(item.name)}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(generateProductImageUrl(item.name, item.imageUrl), item.name)}
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
                            {/* Badges sans badge de catégorie */}
                            <div className="flex gap-1 mb-2 flex-wrap">
                              {/* Badge spécial pour l'offre dessert/boisson */}
                              {category.id === 'desserts' && dessertBoissonOfferActive && (
                                <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white animate-pulse text-xs">
                                  🍹 Boisson offerte !
                                </Badge>
                              )}
                              {item.isVegetarian && (
                                <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                                  Végétarien
                                </Badge>
                              )}
                              {item.isSpicy && (
                                <Badge variant="outline" className="border-orange-500 text-orange-700 text-xs">
                                  Relevé
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
                            
                            {/* Prix et bouton - En bas de la carte */}
                            <div className="mt-auto">
                              <div className="flex justify-between items-center">
                                {shouldShowFreeDessertPriceForItem(item.id) ? (
                                  <div className="flex items-center gap-1">
                                    <Gift className="h-3 w-3 text-green-600" />
                                    <span className="text-sm font-bold text-green-600">0,00€</span>
                                    <span className="text-xs text-gray-400 line-through">{item.price.toFixed(2)}€</span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-gray-900">
                                    {item.price.toFixed(2)}€
                                  </span>
                                )}
                                
                                <div className="relative">
                                  {isCustomProduct(item) ? (
                                    <Button
                                      asChild
                                      className="bg-gold-500 hover:bg-gold-600 text-black rounded-full px-3 text-xs h-7"
                                      size="sm"
                                    >
                                      <Link 
                                        to={isCustomProduct(item) === "poke" ? "/composer-poke" : "/composer-sushi"} 
                                        state={{ baseItem: item }}
                                      >
                                        <Pencil className="mr-1 h-3 w-3" /> Composer
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
                                           className={`rounded-full px-3 text-xs h-7 ${
                                             isBoxDuMidi(category) && isAfter2PM() 
                                               ? 'bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed' 
                                               : 'bg-gold-500 hover:bg-gold-600 text-black'
                                           }`}
                                           size="sm"
                                           disabled={isBoxDuMidi(category) && isAfter2PM()}
                                         >
                                          <Plus className="mr-1 h-3 w-3" /> Ajouter
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
                                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gold-500 text-black px-2 py-1 rounded-full text-xs font-bold shadow-lg z-10"
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
                      ) : (
                        // Desktop layout - Horizontal card
                        <div className="flex items-center">
                          {/* Image */}
                          <div className="w-40 h-40 flex-shrink-0 relative overflow-hidden rounded-l-xl">
                            {item.imageUrl && item.imageUrl !== "/placeholder.svg" ? (
                              <img
                                src={generateProductImageUrl(item.name, item.imageUrl)}
                                alt={generateProductImageAlt(item.name)}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => handleImageClick(generateProductImageUrl(item.name, item.imageUrl), item.name)}
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
                                {/* Badges sans badge de catégorie */}
                                <div className="flex gap-2 mb-2 flex-wrap">
                                  {/* Badge spécial pour l'offre dessert/boisson */}
                                  {category.id === 'desserts' && dessertBoissonOfferActive && (
                                    <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white animate-pulse text-xs">
                                      🍹 Boisson offerte !
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
                                    <Badge variant="outline" className="border-orange-500 text-orange-700 text-xs">
                                      Relevé
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
                                {item.allergens && item.allergens.length > 0 && expandedItems[item.id] && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Allergènes: {Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens}
                                  </p>
                                )}
                              </div>

                              {/* Prix et bouton */}
                              <div className="flex flex-col items-end ml-6">
                                {shouldShowFreeDessertPriceForItem(item.id) ? (
                                  <div className="flex flex-col items-end mb-4">
                                    <div className="flex items-center gap-1">
                                      <Gift className="h-4 w-4 text-green-600" />
                                      <span className="text-lg font-bold text-green-600">0,00€</span>
                                    </div>
                                    <span className="text-sm text-gray-400 line-through">{item.price.toFixed(2)}€</span>
                                  </div>
                                ) : (
                                  <span className="text-lg font-bold text-gray-900 mb-4">
                                    {item.price.toFixed(2)}€
                                  </span>
                                )}
                                
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
                                           className={`rounded-full px-6 ${
                                             isBoxDuMidi(category) && isAfter2PM() 
                                               ? 'bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed' 
                                               : 'bg-gold-500 hover:bg-gold-600 text-black'
                                           }`}
                                           size="sm"
                                           disabled={isBoxDuMidi(category) && isAfter2PM()}
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
                  {/* Badge de catégorie supprimé */}
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
                
                {selectedProductDetails.allergens && selectedProductDetails.allergens.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Allergènes: </span>
                    <span className="text-sm font-medium text-gray-700">
                      {Array.isArray(selectedProductDetails.allergens) ? selectedProductDetails.allergens.join(', ') : selectedProductDetails.allergens}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Image agrandie */}
              <div className="w-full">
                {selectedProductDetails.imageUrl && selectedProductDetails.imageUrl !== "/placeholder.svg" ? (
                  <img
                    src={generateProductImageUrl(selectedProductDetails.name, selectedProductDetails.imageUrl)}
                    alt={generateProductImageAlt(selectedProductDetails.name)}
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
      
      {/* Popup de sélection d'accompagnement */}
      <AccompagnementSelector
        isOpen={showAccompagnementSelector}
        onClose={handleCloseAccompagnementSelector}
        onAccompagnementSelected={handleAccompagnementSelected}
        restaurantId={pendingBoxItem?.item.restaurant_id}
      />
      
      {/* Modale de sélection de wrap pour Wrap Box */}
      {pendingWrapBoxItem && (
        <WrapSelectionModal
          isOpen={isWrapModalOpen}
          onClose={handleWrapSelectionCancel}
          onSelectWrap={handleWrapSelected}
          wrapBoxItem={pendingWrapBoxItem}
        />
      )}
    </>
  );
};

export default CategoryContent;