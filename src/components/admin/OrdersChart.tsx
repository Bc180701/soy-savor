
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
      }),
      // Format revenue for display
      formattedRevenue: `${Number(item.total_revenue).toFixed(2)} €`,
      formattedOrders: `${item.total_orders} commandes`
    }));
  };

  // Calculate the domain for revenue Y-axis
  const getRevenueYAxisDomain = () => {
    if (data.length === 0) return [0, 10];
    
    const maxRevenue = Math.max(...data.map(item => Number(item.total_revenue)));
    // Add 20% padding to the top
    return [0, maxRevenue * 1.2];
  };

  // Calculate the domain for orders Y-axis
  const getOrdersYAxisDomain = () => {
    if (data.length === 0) return [0, 10];
    
    const maxOrders = Math.max(...data.map(item => item.total_orders));
    // Add 20% padding to the top
    return [0, maxOrders * 1.2];
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Évolution des commandes et revenus (7 derniers jours)</CardTitle>
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
                  <XAxis 
                    dataKey="date" 
                    axisLine={{ strokeWidth: 1 }}
                    tickLine={false}
                  />
                  {/* Primary Y-axis for orders */}
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => `${value}`}
                    domain={getOrdersYAxisDomain()}
                    axisLine={{ strokeWidth: 1 }}
                    tickLine={false}
                  />
                  {/* Secondary Y-axis for revenue */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value} €`}
                    domain={getRevenueYAxisDomain()}
                    axisLine={{ strokeWidth: 1 }}
                    tickLine={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_orders"
                    yAxisId="left"
                    stroke="#1E40AF"
                    fill="#93C5FD"
                    strokeWidth={2}
                    name="orders"
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_revenue"
                    yAxisId="right"
                    stroke="#047857"
                    fill="#86EFAC"
                    strokeWidth={2}
                    name="revenue"
                    activeDot={{ r: 6 }}
                  />
                  <ChartTooltip
                    content={
                      <CustomTooltip />
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

// Custom tooltip to better format the values
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium">{`Date: ${label}`}</p>
        <p className="text-sm text-blue-600">{`Commandes: ${payload[0].value}`}</p>
        <p className="text-sm text-green-600">{`Revenus: ${Number(payload[1].value).toFixed(2)} €`}</p>
      </div>
    );
  }

  return null;
};

export default OrdersChart;
