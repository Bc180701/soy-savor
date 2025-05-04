
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts";
import { getOrderCountsByStatus } from "@/services/analyticsService";
import { ChartPie } from "lucide-react";

const COLORS = ['#9b87f5', '#86EFAC', '#F97316', '#FEC6A1', '#7E69AB', '#E5DEFF'];

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

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <ChartPie className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Distribution des statuts</CardTitle>
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
            <ChartContainer 
              config={data.reduce((acc, item, index) => {
                acc[item.status] = {
                  label: item.name,
                  color: COLORS[index % COLORS.length]
                };
                return acc;
              }, {} as Record<string, any>)}
            >
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="status"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
              </PieChart>
            </ChartContainer>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusDistribution;
