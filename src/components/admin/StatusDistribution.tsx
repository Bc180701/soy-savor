
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { getOrderCountsByStatus } from "@/services/analyticsService";

const COLORS = ['#1E40AF', '#047857', '#B91C1C', '#C2410C', '#7C3AED', '#4F46E5'];

const STATUS_LABELS: Record<string, string> = {
  'pending': 'En attente',
  'confirmed': 'Confirmée',
  'preparing': 'En préparation',
  'ready': 'Prête',
  'out-for-delivery': 'En livraison',
  'delivered': 'Livrée',
  'completed': 'Terminée',
  'cancelled': 'Annulée'
};

const StatusDistribution = () => {
  const [data, setData] = useState<{ name: string; value: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const statusCounts = await getOrderCountsByStatus();
      
      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        status
      }));
      
      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Distribution des statuts</CardTitle>
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
          <div className="h-[200px] flex items-center justify-center">
            <ChartContainer 
              config={data.reduce((acc, item, index) => {
                acc[item.status] = {
                  label: item.name,
                  color: COLORS[index % COLORS.length]
                };
                return acc;
              }, {} as Record<string, any>)}
            >
              <PieChart width={200} height={200}>
                <Pie
                  data={data}
                  cx={100}
                  cy={100}
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="status"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent />
                  }
                />
              </PieChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusDistribution;
