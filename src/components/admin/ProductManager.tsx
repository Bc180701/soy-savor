
import ProductsTable from "./ProductsTable";
import CategoriesTable from "./CategoriesTable";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProductManager = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`space-y-8 ${isMobile ? 'px-2' : ''}`}>
      {!isMobile && <h2 className="text-2xl font-bold">Gestion des produits</h2>}
      
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-4">
          <ProductsTable />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <CategoriesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManager;
