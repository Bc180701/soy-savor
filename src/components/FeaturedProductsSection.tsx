
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  const isMobile = useIsMobile();
  
  return (
    <motion.div
      className="w-full"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white rounded-lg h-full">
        <CardContent className="p-0 h-full">
          <div className="flex flex-col h-full">
            {/* Image */}
            <div className="w-full h-48 relative overflow-hidden rounded-t-lg">
              {product.image_url && product.image_url !== "/placeholder.svg" ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">Pas d'image</span>
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
            </div>

            {/* Contenu */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {product.name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">
                {product.description}
              </p>
              
              {/* Prix et bouton */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xl font-bold text-gray-900">
                  {product.price.toFixed(2)}€
                </span>
                <Button asChild size="sm" className="bg-gold-600 hover:bg-gold-700 text-white">
                  <Link to="/commander">Commander</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
        
        // Fetch new products
        const { data: newProductsData, error: newError } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_new', true)
          .limit(3);
        
        if (newError) throw newError;
        setNewProducts(newProductsData || []);
        
        // Fetch best seller products
        const { data: bestSellerData, error: bestError } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('is_best_seller', true)
          .eq('is_new', true)
          .limit(3);
        
        if (bestError) throw bestError;
        setBestSellerProducts(bestSellerData || []);
        
        // Fetch most popular products
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
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
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
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}>
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
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
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
