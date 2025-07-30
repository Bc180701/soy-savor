
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Loader2, Plus, Pencil, Heart, Eye } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MenuItem, SushiCategory } from "@/types";
import { AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  categories: { name: string } | null;
  is_new: boolean;
}

const ProductCard = ({ product, badgeVariant }: { product: Product, badgeVariant: "default" | "new" | "exclusive" }) => {
  const isMobile = useIsMobile();
  const cart = useCart();
  const { toast } = useToast();
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});

  // Convert Product to MenuItem for cart compatibility
  const menuItem: MenuItem = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.image_url,
    category: (product.categories?.name || 'custom') as SushiCategory,
    allergens: [],
    isVegetarian: false,
    isSpicy: false,
    isNew: product.is_new,
    isBestSeller: badgeVariant === "exclusive",
    isGlutenFree: false // Default to false, could be extended to read from product data
  };

  const handleAddToCart = (item: MenuItem) => {
    setClickedButton(item.id);
    cart.addItem(item, 1);
    
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre panier`,
    });
    
    // Reset animation after 600ms
    setTimeout(() => {
      setClickedButton(null);
    }, 600);
  };

  const handleShowDetails = (product: Product) => {
    setSelectedProductDetails(product);
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
        className="w-full"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white rounded-xl h-full">
          <CardContent className="p-0 h-full">
            {isMobile ? (
              // Mobile layout - Vertical card
              <div className="flex flex-col h-full">
                {/* Image */}
                <div className="w-full h-40 flex-shrink-0 relative overflow-hidden rounded-t-xl">
                  {product.image_url && product.image_url !== "/placeholder.svg" ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Pas d'image</span>
                    </div>
                  )}
                  
                  {/* Badge en overlay */}
                  <div className="absolute top-2 left-2">
                    <Badge 
                      variant={badgeVariant === "new" ? "default" : badgeVariant === "exclusive" ? "destructive" : "secondary"}
                      className="text-xs font-medium"
                    >
                      {badgeVariant === "new" ? "NOUVEAU" : 
                       badgeVariant === "exclusive" ? "EXCLUSIF" :
                       "POPULAIRE"}
                    </Badge>
                  </div>

                  {/* Icône cœur en overlay */}
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                      <Heart className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-3 flex flex-col flex-1">
                  {/* Badges supplémentaires */}
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {menuItem.isVegetarian && (
                      <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                        Végétarien
                      </Badge>
                    )}
                    {menuItem.isSpicy && (
                      <Badge variant="outline" className="border-orange-500 text-orange-700 text-xs">
                        Épicé
                      </Badge>
                    )}
                    {menuItem.isGlutenFree && (
                      <Badge variant="glutenfree" className="text-xs">
                        Sans gluten
                      </Badge>
                    )}
                  </div>

                  {/* Titre et bouton œil */}
                  <div className="flex items-start gap-1 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight flex-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowDetails(product)}
                        className="h-5 w-5 p-0 hover:bg-gray-100 flex-shrink-0"
                      >
                        <Eye className="h-3 w-3 text-gray-500" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Description (conditionnellement affichée) */}
                  <AnimatePresence>
                    {product.description && expandedItems[product.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-gray-600 text-xs leading-relaxed mb-2">
                          {product.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Prix et bouton - En bas de la carte */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">
                        {product.price.toFixed(2)}€
                      </span>
                      
                      <div className="relative">
                        <motion.div
                          animate={clickedButton === product.id ? {
                            scale: [1, 0.95, 1.05, 1],
                            transition: { duration: 0.3, ease: "easeInOut" }
                          } : {}}
                        >
                          <Button
                            onClick={() => handleAddToCart(menuItem)}
                            className="bg-gold-500 hover:bg-gold-600 text-black rounded-full px-3 text-xs h-7"
                            size="sm"
                          >
                            <Plus className="mr-1 h-3 w-3" /> Ajouter
                          </Button>
                        </motion.div>
                        
                        {/* +1 Message Animation */}
                        <AnimatePresence>
                          {clickedButton === product.id && (
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
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Desktop layout - Horizontal card
              <div className="flex items-center">
                {/* Image */}
                <div className="w-40 h-40 flex-shrink-0 relative overflow-hidden rounded-l-xl">
                  {product.image_url && product.image_url !== "/placeholder.svg" ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Pas d'image</span>
                    </div>
                  )}
                  
                  {/* Badge en overlay */}
                  <div className="absolute top-3 left-3">
                    <Badge 
                      variant={badgeVariant === "new" ? "default" : badgeVariant === "exclusive" ? "destructive" : "secondary"}
                      className="text-xs font-medium"
                    >
                      {badgeVariant === "new" ? "NOUVEAU" : 
                       badgeVariant === "exclusive" ? "EXCLUSIF" :
                       "POPULAIRE"}
                    </Badge>
                  </div>

                  {/* Icône cœur en overlay */}
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                      <Heart className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Contenu principal */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Badges supplémentaires */}
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {menuItem.isVegetarian && (
                          <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                            Végétarien
                          </Badge>
                        )}
                        {menuItem.isSpicy && (
                          <Badge variant="outline" className="border-orange-500 text-orange-700 text-xs">
                            Épicé
                          </Badge>
                        )}
                        {menuItem.isGlutenFree && (
                          <Badge variant="glutenfree" className="text-xs">
                            Sans gluten
                          </Badge>
                        )}
                      </div>

                      {/* Titre et bouton œil */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        {product.description && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowDetails(product)}
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}
                      </div>
                    
                      {/* Description (conditionnellement affichée) */}
                      <AnimatePresence>
                        {product.description && expandedItems[product.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <p className="text-gray-600 text-sm leading-relaxed mb-2">
                              {product.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Prix et bouton */}
                    <div className="flex flex-col items-end ml-6">
                      <span className="text-lg font-bold text-gray-900 mb-4">
                        {product.price.toFixed(2)}€
                      </span>
                      
                      <div className="relative">
                        <motion.div
                          animate={clickedButton === product.id ? {
                            scale: [1, 0.95, 1.05, 1],
                            transition: { duration: 0.3, ease: "easeInOut" }
                          } : {}}
                        >
                          <Button
                            onClick={() => handleAddToCart(menuItem)}
                            className="bg-gold-500 hover:bg-gold-600 text-black rounded-full px-6"
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Ajouter
                          </Button>
                        </motion.div>
                        
                        {/* +1 Message Animation */}
                        <AnimatePresence>
                          {clickedButton === product.id && (
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
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de détails du produit */}
      <Dialog open={!!selectedProductDetails} onOpenChange={handleCloseDetails}>
        <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">Détails de {selectedProductDetails?.name}</DialogTitle>
          {selectedProductDetails && (
            <div className="bg-white rounded-xl overflow-hidden">
              {/* Détails du produit au-dessus */}
              <div className="p-6 bg-white">
                <div className="mb-4">
                  <Badge 
                    variant={badgeVariant === "new" ? "default" : badgeVariant === "exclusive" ? "destructive" : "secondary"}
                    className="text-sm font-medium mb-2"
                  >
                    {badgeVariant === "new" ? "NOUVEAU" : 
                     badgeVariant === "exclusive" ? "EXCLUSIF" :
                     "POPULAIRE"}
                  </Badge>
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
                
                {selectedProductDetails.categories?.name && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Catégorie: </span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedProductDetails.categories.name}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Image agrandie */}
              <div className="w-full">
                {selectedProductDetails.image_url && selectedProductDetails.image_url !== "/placeholder.svg" ? (
                  <img
                    src={selectedProductDetails.image_url}
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

const FeaturedProductsSection = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    show_nouveautes: true,
    show_populaires: true,
    show_exclusivites: true
  });
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        
        // Récupérer les paramètres de visibilité
        const { data: settingsData, error: settingsError } = await supabase
          .from('featured_products_settings')
          .select('*')
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error("Erreur lors de la récupération des paramètres:", settingsError);
        } else if (settingsData) {
          setSettings({
            show_nouveautes: settingsData.show_nouveautes,
            show_populaires: settingsData.show_populaires,
            show_exclusivites: settingsData.show_exclusivites
          });
        }
        
        // Fetch new products - inclure les produits où is_new = true OU is_new = null
        const { data: newProductsData, error: newError } = await supabase
          .from('products')
          .select('*, categories(name)')
          .or('is_new.eq.true,is_new.is.null')
          .limit(3);
        
        if (newError) throw newError;
        setNewProducts(newProductsData || []);
        
        // Fetch best seller products
        const { data: bestSellerData, error: bestError } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_best_seller', true)
          .or('is_new.eq.true,is_new.is.null')
          .limit(3);
        
        if (bestError) throw bestError;
        setBestSellerProducts(bestSellerData || []);
        
        // Fetch most popular products - basé sur les prix les plus élevés parmi les produits actifs
        const { data: popularData, error: popularError } = await supabase
          .from('products')
          .select('*, categories(name)')
          .or('is_new.eq.true,is_new.is.null')
          .order('price', { ascending: false })
          .limit(4);
        
        if (popularError) throw popularError;
        setPopularProducts(popularData || []);

        console.log('📦 Produits récupérés:', {
          nouveautes: newProductsData?.length || 0,
          bestsellers: bestSellerData?.length || 0,
          populaires: popularData?.length || 0
        });

      } catch (error) {
        console.error("Error fetching featured products:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits mis en avant",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedProducts();
  }, [toast]);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
          <span className="ml-2">Chargement des produits...</span>
        </div>
      </section>
    );
  }

  // Vérifier si au moins une section est visible
  const hasVisibleSections = settings.show_nouveautes || settings.show_populaires || settings.show_exclusivites;
  
  if (!hasVisibleSections) {
    return null; // Ne pas afficher la section si toutes sont masquées
  }

  // Déterminer quelle section afficher par défaut
  const getDefaultTab = () => {
    if (settings.show_nouveautes) return "nouveautes";
    if (settings.show_populaires) return "populaires";
    return "exclusivites";
  };

  // Calculer le nombre de colonnes pour les onglets
  const visibleTabsCount = [settings.show_nouveautes, settings.show_populaires, settings.show_exclusivites].filter(Boolean).length;
  const gridColsClass = visibleTabsCount === 3 ? 'grid-cols-3' : visibleTabsCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Nos produits à découvrir</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Découvrez notre sélection de produits préparés avec soin par nos chefs.
          </p>
        </div>

        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className={`grid w-full max-w-2xl mx-auto ${gridColsClass} mb-8`}>
            {settings.show_nouveautes && (
              <TabsTrigger value="nouveautes" className="rounded-full">
                NOUVEAUTÉS
              </TabsTrigger>
            )}
            {settings.show_populaires && (
              <TabsTrigger value="populaires" className="rounded-full">
                POPULAIRES
              </TabsTrigger>
            )}
            {settings.show_exclusivites && (
              <TabsTrigger value="exclusivites" className="rounded-full">
                EXCLUSIVITÉS
              </TabsTrigger>
            )}
          </TabsList>

          {settings.show_nouveautes && (
            <TabsContent value="nouveautes">
              <div className={`${isMobile ? "grid grid-cols-2 gap-3" : "space-y-4"}`}>
                {newProducts.length > 0 ? (
                  newProducts.map((product) => (
                    <ProductCard key={product.id} product={product} badgeVariant="new" />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
                    <p className="text-gray-500">Aucun produit en nouveauté disponible actuellement.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {settings.show_populaires && (
            <TabsContent value="populaires">
              <div className={`${isMobile ? "grid grid-cols-2 gap-3" : "space-y-4"}`}>
                {popularProducts.length > 0 ? (
                  popularProducts.map((product) => (
                    <ProductCard key={product.id} product={product} badgeVariant="default" />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
                    <p className="text-gray-500">Aucun produit populaire disponible actuellement.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {settings.show_exclusivites && (
            <TabsContent value="exclusivites">
              <div className={`${isMobile ? "grid grid-cols-2 gap-3" : "space-y-4"}`}>
                {bestSellerProducts.length > 0 ? (
                  bestSellerProducts.map((product) => (
                    <ProductCard key={product.id} product={product} badgeVariant="exclusive" />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
                    <p className="text-gray-500">Aucun produit exclusif disponible actuellement.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-12 text-center">
          <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white">
            <Link to="/commander">Commander maintenant</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
