
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTable from "./ProductsTable";
import CategoriesTable from "./CategoriesTable";

const ProductManager = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Gestion des produits</h2>
      
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <ProductsTable />
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoriesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductManager;
