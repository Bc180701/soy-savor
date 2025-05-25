
import ProductsTable from "./ProductsTable";
import PromotionsManager from "./PromotionsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const ProductManager = () => {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Gestion des produits</h2>
      
      <Tabs defaultValue="products" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
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
