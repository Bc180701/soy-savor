
import ProductsTable from "./ProductsTable";
import PromotionsManager from "./PromotionsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const ProductManager = () => {
  const [activeTab, setActiveTab] = useState("products");
  const isMobile = useIsMobile();

  return (
    <div className={`space-y-8 ${isMobile ? 'px-2' : ''}`}>
      {!isMobile && <h2 className="text-2xl font-bold">Gestion des produits</h2>}
      
      <Tabs defaultValue="products" onValueChange={setActiveTab}>
        <TabsList className={isMobile ? 'w-full' : ''}>
          <TabsTrigger value="products" className={isMobile ? 'flex-1' : ''}>
            {isMobile ? 'Produits' : 'Produits'}
          </TabsTrigger>
          <TabsTrigger value="promotions" className={isMobile ? 'flex-1' : ''}>
            {isMobile ? 'Promos' : 'Promotions'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsTable />
        </TabsContent>
        <TabsContent value="promotions">
          <PromotionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManager;
