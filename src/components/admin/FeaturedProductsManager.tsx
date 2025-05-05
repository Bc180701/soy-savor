
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FeaturedProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProductFlag = async (productId, flagName, value) => {
    try {
      const updateData = { [flagName]: value };
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;

      // Update local state
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, [flagName]: value }
          : product
      ));

      toast({
        title: "Produit mis à jour",
        description: `Le statut a été mis à jour avec succès`,
        variant: "success",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive",
      });
    }
  };

  // Filter products based on specific flags
  const newProducts = products.filter(product => product.is_new);
  const bestSellerProducts = products.filter(product => product.is_best_seller);
  
  // Function to check if maximum allowed products is reached
  const isMaxReached = (type) => {
    if (type === 'new') return newProducts.length >= 3;
    if (type === 'best_seller') return bestSellerProducts.length >= 3;
    return false;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Produits mis en avant</h2>
        <p className="text-muted-foreground mb-6">
          Gérez les produits affichés sur la page d'accueil dans les sections Nouveautés, Populaires et Exclusivités.
        </p>
      </div>

      <Tabs defaultValue="nouveautes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="nouveautes">Nouveautés (3 max)</TabsTrigger>
          <TabsTrigger value="exclusivites">Exclusivités (3 max)</TabsTrigger>
        </TabsList>

        <TabsContent value="nouveautes">
          <Card>
            <CardHeader>
              <CardTitle>Produits en nouveauté</CardTitle>
              <CardDescription>
                Ces produits apparaissent dans la section "Nouveautés" sur la page d'accueil. Maximum 3 produits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductsTable 
                products={products}
                flagName="is_new"
                currentlyFeatured={newProducts}
                isMaxReached={isMaxReached('new')}
                onUpdateFlag={updateProductFlag}
                maxProducts={3}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exclusivites">
          <Card>
            <CardHeader>
              <CardTitle>Produits exclusifs</CardTitle>
              <CardDescription>
                Ces produits apparaissent dans la section "Exclusivités" sur la page d'accueil. Maximum 3 produits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductsTable 
                products={products}
                flagName="is_best_seller"
                currentlyFeatured={bestSellerProducts}
                isMaxReached={isMaxReached('best_seller')}
                onUpdateFlag={updateProductFlag}
                maxProducts={3}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h3 className="font-medium text-blue-800 mb-2">À propos des produits populaires</h3>
        <p className="text-sm text-blue-700">
          Les produits populaires sont déterminés automatiquement par le système en fonction du nombre de commandes. 
          Ils apparaissent dans la section "Populaires" sur la page d'accueil (maximum 4 produits).
        </p>
      </div>
    </div>
  );
};

const ProductsTable = ({ 
  products, 
  flagName, 
  currentlyFeatured, 
  isMaxReached,
  onUpdateFlag,
  maxProducts
}) => {
  if (!products || products.length === 0) {
    return <div className="p-4 text-center">Aucun produit disponible</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 p-3 rounded-md flex items-center justify-between">
        <span className="text-amber-800">
          {currentlyFeatured.length} / {maxProducts} produits sélectionnés
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Image</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead className="w-[100px]">Prix</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-10 h-10 object-cover rounded-md" 
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                    <span className="text-xs">N/A</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                {product.name}
                {product[flagName] && (
                  <Badge className="ml-2 bg-green-100 text-green-800 border-0">
                    Sélectionné
                  </Badge>
                )}
              </TableCell>
              <TableCell>{product.categories?.name || "N/A"}</TableCell>
              <TableCell>{product.price.toFixed(2)} €</TableCell>
              <TableCell className="text-right">
                {product[flagName] ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdateFlag(product.id, flagName, false)}
                  >
                    <XCircle className="h-5 w-5 text-red-500" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdateFlag(product.id, flagName, true)}
                    disabled={isMaxReached && !product[flagName]}
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FeaturedProductsManager;
