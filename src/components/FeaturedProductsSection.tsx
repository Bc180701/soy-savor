
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [showFullImage, setShowFullImage] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const isMobile = useIsMobile();
  
  const handleImageClick = () => {
    setShowFullImage(true);
  };

  const toggleDetails = () => {
    setExpandedDetails(!expandedDetails);
  };
  
  return (
    <motion.div
      className="w-full"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 bg-white rounded-xl h-full">
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
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={handleImageClick}
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
                <div className="flex gap-1 mb-2">
                  <Badge 
                    variant={badgeVariant === "new" ? "default" : badgeVariant === "exclusive" ? "destructive" : "secondary"}
                    className="text-xs font-medium uppercase tracking-wider"
                  >
                    {badgeVariant === "new" ? "NOUVEAU" : 
                     badgeVariant === "exclusive" ? "EXCLUSIF" :
                     product.categories?.name || "PRODUIT"}
                  </Badge>
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
                      onClick={toggleDetails}
                      className="h-5 w-5 p-0 hover:bg-gray-100 flex-shrink-0"
                    >
                      <Eye className="h-3 w-3 text-gray-500" />
                    </Button>
                  )}
                </div>
                
                {/* Description étendue */}
                {expandedDetails && product.description && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-2"
                  >
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {product.description}
                    </p>
                  </motion.div>
                )}
                
                {/* Prix et bouton */}
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    {product.price.toFixed(2)}€
                  </span>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link to="/commander">Commander</Link>
                  </Button>
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
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={handleImageClick}
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
                      <Badge 
                        variant={badgeVariant === "new" ? "default" : badgeVariant === "exclusive" ? "destructive" : "secondary"}
                        className="text-xs font-medium uppercase tracking-wider"
                      >
                        {badgeVariant === "new" ? "NOUVEAU" : 
                         badgeVariant === "exclusive" ? "EXCLUSIF" :
                         product.categories?.name || "PRODUIT"}
                      </Badge>
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
                          onClick={toggleDetails}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Description étendue */}
                    {expandedDetails && product.description && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mb-2"
                      >
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {product.description}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Prix et bouton */}
                  <div className="flex flex-col items-end ml-6 gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {product.price.toFixed(2)}€
                    </span>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/commander">Commander</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Dialog for full-size view */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">Image de {product.name}</DialogTitle>
          <div className="w-full bg-[#f9fafb] rounded-lg overflow-hidden">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-auto object-contain max-h-[80vh]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const FeaturedProductsSection = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch new products (actifs uniquement)
        const { data: newProductsData, error: newError } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_new', true)
          .limit(3);
        
        if (newError) throw newError;
        setNewProducts(newProductsData || []);
        
        // Fetch best seller products (actifs uniquement)
        const { data: bestSellerData, error: bestError } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_best_seller', true)
          .eq('is_new', true)
          .limit(3);
        
        if (bestError) throw bestError;
        setBestSellerProducts(bestSellerData || []);
        
        // Fetch most popular products (using order count from popular_products) (actifs uniquement)
        const { data: popularData, error: popularError } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_new', true)
          .order('price', { ascending: false })
          .limit(4);
        
        if (popularError) throw popularError;
        setPopularProducts(popularData || []);
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

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Nos produits à découvrir</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Découvrez notre sélection de produits préparés avec soin par nos chefs.
          </p>
        </div>

        <Tabs defaultValue="nouveautes" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="nouveautes" className="rounded-full">
              NOUVEAUTÉS
            </TabsTrigger>
            <TabsTrigger value="populaires" className="rounded-full">
              POPULAIRES
            </TabsTrigger>
            <TabsTrigger value="exclusivites" className="rounded-full">
              EXCLUSIVITÉS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nouveautes">
            <div className={isMobile ? "grid grid-cols-2 gap-3" : "space-y-4"}>
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

          <TabsContent value="populaires">
            <div className={isMobile ? "grid grid-cols-2 gap-3" : "space-y-4"}>
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

          <TabsContent value="exclusivites">
            <div className={isMobile ? "grid grid-cols-2 gap-3" : "space-y-4"}>
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
