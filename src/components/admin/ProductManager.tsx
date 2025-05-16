
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTable from "./ProductsTable";
import CategoriesTable from "./CategoriesTable";
import FeaturedProductsManager from "./FeaturedProductsManager";

const ProductManager = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Gestion des produits</h2>
      
      <Tabs defaultValue="products" className="w-full">
        <TabsList variant="horizontal" className="mb-4">
          <TabsTrigger variant="horizontal" value="products">Produits</TabsTrigger>
          <TabsTrigger variant="horizontal" value="categories">Catégories</TabsTrigger>
          <TabsTrigger variant="horizontal" value="featured">Produits mis en avant</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <ProductsTable />
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoriesTable />
        </TabsContent>
        
        <TabsContent value="featured">
          <FeaturedProductsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManager;
