
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

// Sample data for the featured products
const sampleNewProducts: Product[] = [
  {
    id: "1",
    name: "Sushi Mix Deluxe",
    description: "Assortiment de 12 sushis variés avec saumon, thon et crevette",
    price: 16.90,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
    category: "Plateaux"
  },
  {
    id: "2",
    name: "California Roll Set",
    description: "8 pièces de california rolls au saumon avocat",
    price: 9.50,
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754",
    category: "Rolls"
  },
  {
    id: "3",
    name: "Poke Bowl Signature",
    description: "Bol de riz avec saumon frais, avocat, edamame, mangue et sauce spéciale",
    price: 14.90,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    category: "Poke Bowls"
  }
];

const samplePopularProducts: Product[] = [
  {
    id: "4",
    name: "Plateau Découverte",
    description: "16 pièces variées pour découvrir nos spécialités",
    price: 19.90,
    image: "https://images.unsplash.com/photo-1617196034183-421b4917c92d",
    category: "Plateaux"
  },
  {
    id: "5",
    name: "Maki Saumon",
    description: "6 pièces de maki au saumon frais",
    price: 7.90,
    image: "https://images.unsplash.com/photo-1565751636736-283151a433ab",
    category: "Makis"
  },
  {
    id: "6",
    name: "Sashimi Thon",
    description: "5 tranches de thon rouge frais du jour",
    price: 12.90,
    image: "https://images.unsplash.com/photo-1597797853429-t87640b35efa",
    category: "Sashimi"
  },
  {
    id: "7",
    name: "Gyoza Poulet",
    description: "5 raviolis japonais au poulet et légumes",
    price: 6.90,
    image: "https://images.unsplash.com/photo-1590330813083-fc22d4b6a48c",
    category: "Entrées"
  }
];

const sampleExclusiveProducts: Product[] = [
  {
    id: "8",
    name: "Dragon Roll Premium",
    description: "Roll signature avec tempura de crevette, avocat et anguille",
    price: 15.90,
    image: "https://images.unsplash.com/photo-1607301406259-dfb186e15de8",
    category: "Exclusif"
  },
  {
    id: "9",
    name: "Plateau Omakase",
    description: "Sélection premium au choix du chef (24 pièces)",
    price: 34.90,
    image: "https://images.unsplash.com/photo-1563200049-063524a8ee59",
    category: "Exclusif"
  },
  {
    id: "10",
    name: "Tataki de Bœuf Wagyu",
    description: "Fines tranches de bœuf Wagyu snackées aux épices japonaises",
    price: 22.90,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
    category: "Exclusif"
  }
];

const ProductCard = ({ product, badgeVariant }: { product: Product, badgeVariant: "default" | "new" | "exclusive" }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  
  return (
    <motion.div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      whileHover={{ y: -5 }}
    >
      <div className="relative pb-[60%] w-full bg-[#f9fafb] flex items-center justify-center overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="absolute inset-0 w-full h-full object-cover p-2 cursor-pointer"
          onClick={() => setShowFullImage(true)}
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

      {/* Image Dialog for full-size view */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="sm:max-w-lg p-0 bg-transparent border-0 shadow-none">
          <DialogTitle className="sr-only">Image de {product.name}</DialogTitle>
          <div className="w-full bg-[#f9fafb] rounded-lg overflow-hidden">
            <img
              src={product.image}
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
              {sampleNewProducts.map((product) => (
                <ProductCard key={product.id} product={product} badgeVariant="new" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="populaires">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {samplePopularProducts.map((product) => (
                <ProductCard key={product.id} product={product} badgeVariant="default" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="exclusivites">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {sampleExclusiveProducts.map((product) => (
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

export default FeaturedProductsSection;
