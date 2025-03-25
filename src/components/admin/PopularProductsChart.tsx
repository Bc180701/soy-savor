
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { getPopularProducts, PopularProduct } from "@/services/analyticsService";

const PopularProductsChart = () => {
  const [data, setData] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const products = await getPopularProducts(5);
      setData(products);
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Produits les plus commandés</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="h-[200px]">
            <ChartContainer config={{ product: { color: "#1E40AF" } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data}>
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="product_name" 
                    width={100}
                    tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                  />
                  <Bar 
                    dataKey="order_count" 
                    fill="#93C5FD" 
                    name="product"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent />
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopularProductsChart;
