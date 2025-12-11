import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, ChevronDown, ChevronUp, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProductSales {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopProductsRankingProps {
  restaurantId?: string | null;
}

const TopProductsRanking = ({ restaurantId }: TopProductsRankingProps) => {
  const [products, setProducts] = useState<ProductSales[]>([]);
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
          setProducts([]);
          return;
        }

        // Aggregate products from all orders
        const productMap = new Map<string, { quantity: number; revenue: number }>();

        data?.forEach(order => {
          const items = order.items_summary as any[];
          if (Array.isArray(items)) {
            items.forEach(item => {
              // Handle both encoded (n, p, q) and direct (name, price, quantity) formats
              let name: string;
              let quantity: number;
              let price: number;

              if (item.name) {
                // Direct format
                name = item.name;
                quantity = item.quantity || 1;
                price = item.price || 0;
              } else if (item.n) {
                // Encoded format - decode using product_codes
                name = codeToName.get(item.n) || item.n;
                quantity = item.q || 1;
                price = item.p ? item.p / 100 : 0;
              } else {
                return; // Skip invalid items
              }

              const existing = productMap.get(name) || { quantity: 0, revenue: 0 };
              productMap.set(name, {
                quantity: existing.quantity + quantity,
                revenue: existing.revenue + (price * quantity)
              });
            });
          }
        });

        // Convert to array, filter out free items (0€) and sort by quantity
        const sortedProducts = Array.from(productMap.entries())
          .filter(([_, data]) => data.revenue > 0) // Exclude free items
          .map(([name, data]) => ({
            name,
            quantity: data.quantity,
            revenue: data.revenue
          }))
          .sort((a, b) => b.quantity - a.quantity);

        setProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching top products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [restaurantId]);

  const displayedProducts = showAll ? products : products.slice(0, 10);

  const handleExportCSV = () => {
    const headers = ['Rang', 'Produit', 'Quantité vendue', 'Chiffre d\'affaires (€)'];
    const rows = products.map((product, index) => [
      index + 1,
      `"${product.name.replace(/"/g, '""')}"`,
      product.quantity,
      product.revenue.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `classement-produits-${restaurantId || 'tous'}-${new Date().toISOString().split('T')[0]}.csv`);
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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg">Classement des produits les plus vendus</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={products.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
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
            
            {products.length > 10 && (
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
                      Voir plus ({products.length - 10} autres)
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
