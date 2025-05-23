
import ProductsTable from "./ProductsTable";
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
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-4">Promotion active</h3>
            <div className="bg-green-50 p-4 border border-green-200 rounded-md">
              <p className="font-medium">1 Plateau Acheté = 1 Dessert Offert</p>
              <p className="text-sm text-gray-600 mt-2">
                Cette promotion est active. Lorsqu'un client ajoute un plateau dans son panier, 
                il pourra choisir un dessert gratuit.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManager;
