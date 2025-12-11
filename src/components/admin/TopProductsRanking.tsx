import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, ChevronDown, ChevronUp, Download, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProductSales {
  name: string;
  quantity: number;
  revenue: number;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
}

interface TopProductsRankingProps {
  restaurantId?: string | null;
}

const TopProductsRanking = ({ restaurantId }: TopProductsRankingProps) => {
  const [allProducts, setAllProducts] = useState<ProductSales[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductSales[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true);
      try {
        // Fetch product codes for decoding
        const { data: productCodes } = await supabase
          .from('product_codes')
          .select('code, item_name');

        const codeToName = new Map<string, string>();
        productCodes?.forEach(pc => {
          codeToName.set(pc.code, pc.item_name);
        });

        // Fetch products with their categories
        let productsQuery = supabase
          .from('products')
          .select('name, category_id');
        
        if (restaurantId) {
          productsQuery = productsQuery.eq('restaurant_id', restaurantId);
        }

        const { data: productsData } = await productsQuery;
        
        const productToCategory = new Map<string, string>();
        productsData?.forEach(p => {
          productToCategory.set(p.name.toLowerCase(), p.category_id);
        });

        // Fetch categories
        let categoriesQuery = supabase
          .from('categories')
          .select('id, name')
          .order('display_order');
        
        if (restaurantId) {
          categoriesQuery = categoriesQuery.eq('restaurant_id', restaurantId);
        }

        const { data: categoriesData } = await categoriesQuery;
        setCategories(categoriesData || []);

        // Fetch orders
        let query = supabase
          .from('orders')
          .select('items_summary')
          .eq('payment_status', 'paid');

        if (restaurantId) {
          query = query.eq('restaurant_id', restaurantId);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching orders:", error);
          setAllProducts([]);
          setFilteredProducts([]);
          return;
        }

        // Aggregate products from all orders
        const productMap = new Map<string, { quantity: number; revenue: number; categoryId?: string }>();

        data?.forEach(order => {
          const items = order.items_summary as any[];
          if (Array.isArray(items)) {
            items.forEach(item => {
              let name: string;
              let quantity: number;
              let price: number;

              if (item.name) {
                name = item.name;
                quantity = item.quantity || 1;
                price = item.price || 0;
              } else if (item.n) {
                name = codeToName.get(item.n) || item.n;
                quantity = item.q || 1;
                price = item.p ? item.p / 100 : 0;
              } else {
                return;
              }

              const categoryId = productToCategory.get(name.toLowerCase());
              const existing = productMap.get(name) || { quantity: 0, revenue: 0, categoryId };
              productMap.set(name, {
                quantity: existing.quantity + quantity,
                revenue: existing.revenue + (price * quantity),
                categoryId: categoryId || existing.categoryId
              });
            });
          }
        });

        const excludedItems = ['gingembre'];

        const sortedProducts = Array.from(productMap.entries())
          .filter(([name, data]) => data.revenue > 0 && !excludedItems.includes(name.toLowerCase()))
          .map(([name, data]) => ({
            name,
            quantity: data.quantity,
            revenue: data.revenue,
            categoryId: data.categoryId
          }))
          .sort((a, b) => b.quantity - a.quantity);

        setAllProducts(sortedProducts);
        setFilteredProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching top products:", error);
        setAllProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [restaurantId]);

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(allProducts);
    } else {
      setFilteredProducts(allProducts.filter(p => p.categoryId === selectedCategory));
    }
    setShowAll(false);
  }, [selectedCategory, allProducts]);

  const displayedProducts = showAll ? filteredProducts : filteredProducts.slice(0, 10);

  const handleExportCSV = () => {
    const headers = ['Rang', 'Produit', 'Catégorie', 'Quantité vendue', 'Chiffre d\'affaires (€)'];
    const rows = filteredProducts.map((product, index) => {
      const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Non catégorisé';
      return [
        index + 1,
        `"${product.name.replace(/"/g, '""')}"`,
        `"${categoryName}"`,
        product.quantity,
        product.revenue.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const categoryName = selectedCategory === "all" ? "toutes" : categories.find(c => c.id === selectedCategory)?.name || selectedCategory;
    link.setAttribute('download', `classement-produits-${categoryName}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-500 text-white';
      case 1: return 'bg-gray-400 text-white';
      case 2: return 'bg-amber-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 pb-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Classement des produits les plus vendus</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredProducts.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rang</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right w-[120px]">Quantité</TableHead>
                    <TableHead className="text-right w-[140px]">CA généré</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedProducts.map((product, index) => (
                    <TableRow key={product.name}>
                      <TableCell>
                        <Badge className={getMedalColor(index)}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {product.quantity}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {product.revenue.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredProducts.length > 10 && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAll(!showAll)}
                  className="gap-2"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Voir moins
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Voir plus ({filteredProducts.length - 10} autres)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProductsRanking;
