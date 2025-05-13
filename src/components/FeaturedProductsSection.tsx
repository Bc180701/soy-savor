
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      whileHover={{ y: -5 }}
    >
      <div className="relative pb-[60%] w-full bg-[#f9fafb] flex items-center justify-center overflow-hidden">
        <img 
          src={product.image_url || "/placeholder.svg"} 
          alt={product.name} 
          className="absolute inset-0 w-full h-full object-cover p-2 cursor-pointer"
          onClick={() => setShowFullImage(true)}
        />
      </div>
      <div className="p-6">
        <Badge variant={badgeVariant} className="mb-2">
          {product.categories?.name || "Produit"}
        </Badge>
        <h3 className="font-bold text-xl mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-gold-600 font-bold">{product.price.toFixed(2)} €</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/commander">Commander</Link>
          </Button>
        </div>
      </div>

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

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        
        // Mock data for sample products
        const sampleProducts: Product[] = [
          {
            id: "1", 
            name: "California Roll", 
            description: "Avocat, concombre, crabe", 
            price: 6.5, 
            image_url: "/placeholder.svg", 
            category_id: "maki", 
            categories: { name: "Maki" }, 
            is_new: true
          },
          {
            id: "2", 
            name: "Salmon Nigiri", 
            description: "Saumon frais", 
            price: 4.5, 
            image_url: "/placeholder.svg", 
            category_id: "sushi", 
            categories: { name: "Sushi" }, 
            is_new: true
          },
          {
            id: "3", 
            name: "Spicy Tuna Roll", 
            description: "Thon épicé, avocat", 
            price: 7.5, 
            image_url: "/placeholder.svg", 
            category_id: "maki", 
            categories: { name: "Maki" }, 
            is_new: true
          }
        ];
        
        setNewProducts(sampleProducts);
        setBestSellerProducts(sampleProducts.slice(0, 2));
        setPopularProducts(sampleProducts);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newProducts.length > 0 ? (
                newProducts.map((product) => (
                  <ProductCard key={product.id} product={product} badgeVariant="new" />
                ))
              ) : (
                <div className="col-span-3 text-center p-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">Aucun produit en nouveauté disponible actuellement.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="populaires">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {popularProducts.length > 0 ? (
                popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} badgeVariant="default" />
                ))
              ) : (
                <div className="col-span-4 text-center p-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">Aucun produit populaire disponible actuellement.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="exclusivites">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {bestSellerProducts.length > 0 ? (
                bestSellerProducts.map((product) => (
                  <ProductCard key={product.id} product={product} badgeVariant="exclusive" />
                ))
              ) : (
                <div className="col-span-3 text-center p-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">Aucun produit exclusif disponible actuellement.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white">
            <Link to="/menu">Voir toute notre carte</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
