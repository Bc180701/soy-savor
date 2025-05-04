
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { getPopularProducts, PopularProduct } from "@/services/analyticsService";
import { TrendingUp } from "lucide-react";

const COLORS = ['#9b87f5', '#86EFAC', '#F97316', '#FEC6A1', '#7E69AB'];

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
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Produits les plus commandés</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[250px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ChartContainer config={{ product: { color: "#9b87f5" } }}>
              <BarChart 
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="product_name" 
                  width={180}
                  tickFormatter={(value) => value.length > 24 ? `${value.substring(0, 24)}...` : value}
                />
                <Bar 
                  dataKey="order_count" 
                  name="product"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <ChartTooltip
                  content={
                    <ChartTooltipContent />
                  }
                />
              </BarChart>
            </ChartContainer>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default PopularProductsChart;
