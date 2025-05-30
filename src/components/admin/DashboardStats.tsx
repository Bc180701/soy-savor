
import { useEffect, useState } from "react";
import { CreditCard, Package, ShoppingBag, TrendingUp } from "lucide-react";
import StatisticsCard from "./StatisticsCard";
import { getTotalRevenue } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardStats = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total revenue
        const revenue = await getTotalRevenue();
        setTotalRevenue(revenue);

        // Get total orders count
        const { count: totalCount, error: totalError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        if (!totalError) {
          setTotalOrders(totalCount || 0);
        }

        // Get pending orders count
        const { count: pendingCount, error: pendingError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed', 'preparing']);
        
        if (!pendingError) {
          setPendingOrders(pendingCount || 0);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 px-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      <StatisticsCard
        title="Revenu Total"
        value={`${totalRevenue.toFixed(2)} €`}
        icon={<TrendingUp className="h-4 w-4" />}
        description="Toutes les commandes payées"
      />
      <StatisticsCard
        title="Commandes Totales"
        value={totalOrders}
        icon={<ShoppingBag className="h-4 w-4" />}
        description="Depuis le début"
      />
      <StatisticsCard
        title="Commandes en Attente"
        value={pendingOrders}
        icon={<Package className="h-4 w-4" />}
        description="À préparer ou en préparation"
      />
      <StatisticsCard
        title="Panier Moyen"
        value={totalOrders > 0 ? `${(totalRevenue / totalOrders).toFixed(2)} €` : '0.00 €'}
        icon={<CreditCard className="h-4 w-4" />}
        description="Par commande"
      />
    </div>
  );
};

export default DashboardStats;
