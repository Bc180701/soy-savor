import { useEffect, useState } from "react";
import { fetchAllProducts } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import OrderList from "@/components/OrderList";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const [products, setProducts] = useState([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadProducts = async () => {
      const productsData = await fetchAllProducts();
      setProducts(productsData);
    };
    
    loadProducts();
  }, []);

  return (
    <div className="container mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold mb-8">Administration</h1>
      
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          <OrderList />
        </TabsContent>
        
        <TabsContent value="products">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des Produits</h2>
            <p className="text-gray-600 mb-4">
              {products.length} produits dans la base de données
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border">Nom</th>
                    <th className="p-2 text-left border">Description</th>
                    <th className="p-2 text-left border">Prix</th>
                    <th className="p-2 text-left border">Catégorie</th>
                    <th className="p-2 text-left border">Populaire</th>
                    <th className="p-2 text-left border">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 border">{product.name}</td>
                      <td className="p-2 border">{product.description || '-'}</td>
                      <td className="p-2 border">{product.price.toFixed(2)} €</td>
                      <td className="p-2 border">{product.categories?.name || product.category_id}</td>
                      <td className="p-2 border">{product.is_best_seller ? 'Oui' : 'Non'}</td>
                      <td className="p-2 border">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-16 h-16 object-cover"
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
