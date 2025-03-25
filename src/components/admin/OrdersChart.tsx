
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { getOrderAnalytics, OrderAnalytics } from "@/services/analyticsService";

const OrdersChart = () => {
  const [data, setData] = useState<OrderAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const analytics = await getOrderAnalytics(7);
      // Reverse to show in chronological order
      setData(analytics.reverse());
      setLoading(false);
    };

    fetchData();
  }, []);

  // Format date for display
  const formatData = (data: OrderAnalytics[]) => {
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      })
    }));
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Évolution des commandes (7 derniers jours)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ChartContainer 
              config={{
                orders: {
                  label: "Commandes",
                  color: "#1E40AF" // Blue
                },
                revenue: {
                  label: "Revenus (€)",
                  color: "#047857" // Green
                }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formatData(data)}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Area
                    type="monotone"
                    dataKey="total_orders"
                    stroke="#1E40AF"
                    fill="#93C5FD"
                    strokeWidth={2}
                    name="orders"
                  />
                  <Area
                    type="monotone"
                    dataKey="total_revenue"
                    stroke="#047857"
                    fill="#86EFAC"
                    strokeWidth={2}
                    name="revenue"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent nameKey="name" labelKey="date" />
                    }
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersChart;
