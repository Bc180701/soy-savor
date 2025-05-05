
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

interface FeaturedProductsSectionProps {
  newProducts: Product[];
  popularProducts: Product[];
  exclusiveProducts: Product[];
}

const FeaturedProductsSection = ({ 
  newProducts, 
  popularProducts, 
  exclusiveProducts 
}: FeaturedProductsSectionProps) => {
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
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} badgeVariant="new" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="populaires">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} badgeVariant="default" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="exclusivites">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {exclusiveProducts.map((product) => (
                <ProductCard key={product.id} product={product} badgeVariant="exclusive" />
              ))}
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

const ProductCard = ({ product, badgeVariant }: { product: Product, badgeVariant: "default" | "new" | "exclusive" }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      whileHover={{ y: -5 }}
    >
      <div className="h-48 overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform hover:scale-105" 
        />
      </div>
      <div className="p-6">
        <Badge variant={badgeVariant} className="mb-2">
          {product.category}
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
    </motion.div>
  );
};

export default FeaturedProductsSection;
