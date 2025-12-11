import { useEffect, useState } from "react";
import { CreditCard, Package, ShoppingBag, TrendingUp } from "lucide-react";
import StatisticsCard from "./StatisticsCard";
import TopProductsRanking from "./TopProductsRanking";
import { getTotalRevenue } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

interface DashboardStatsProps {
  sessionRestaurantId?: string | null;
}

const DashboardStats = ({ sessionRestaurantId }: DashboardStatsProps) => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
  const [weekRevenue, setWeekRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  
  // Use sessionRestaurantId if provided, otherwise fall back to context
  const { currentRestaurant } = useRestaurantContext();
  const activeRestaurantId = sessionRestaurantId || currentRestaurant?.id;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Récupération des statistiques pour le restaurant:", activeRestaurantId);

        // Get total revenue for the selected restaurant
        const revenue = await getTotalRevenue(activeRestaurantId);
        setTotalRevenue(revenue);

        // Calculer les dates
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Début de la semaine (lundi)
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        
        // Début du mois
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fonction helper pour récupérer les revenus par période
        const getRevenueForPeriod = async (startDate: Date, endDate?: Date) => {
          let query = supabase
            .from('orders')
            .select('total')
            .eq('payment_status', 'paid')
            .gte('created_at', startDate.toISOString());
          
          if (endDate) {
            query = query.lt('created_at', endDate.toISOString());
          }
          
          if (activeRestaurantId) {
            query = query.eq('restaurant_id', activeRestaurantId);
          }
          
          const { data, error } = await query;
          if (error) {
            console.error('Erreur récupération revenus:', error);
            return 0;
          }
          
          return data?.reduce((sum, order) => sum + ((order as any)?.total || 0), 0) || 0;
        };

        // Récupérer les revenus par période
        const [todayRev, yesterdayRev, weekRev, monthRev] = await Promise.all([
          getRevenueForPeriod(today, new Date(today.getTime() + 24 * 60 * 60 * 1000)),
          getRevenueForPeriod(yesterday, today),
          getRevenueForPeriod(startOfWeek),
          getRevenueForPeriod(startOfMonth)
        ]);

        setTodayRevenue(todayRev);
        setYesterdayRevenue(yesterdayRev);
        setWeekRevenue(weekRev);
        setMonthRevenue(monthRev);

        // Get total orders count for the selected restaurant
        let totalQuery = supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        if (activeRestaurantId) {
          totalQuery = totalQuery.eq('restaurant_id', activeRestaurantId);
        }
        
        const { count: totalCount, error: totalError } = await totalQuery;
        
        if (!totalError) {
          setTotalOrders(totalCount || 0);
        }

        // Get pending orders count for the selected restaurant
        let pendingQuery = supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed', 'preparing']);
        
        if (activeRestaurantId) {
          pendingQuery = pendingQuery.eq('restaurant_id', activeRestaurantId);
        }
        
        const { count: pendingCount, error: pendingError } = await pendingQuery;
        
        if (!pendingError) {
          setPendingOrders(pendingCount || 0);
        }

        console.log(`Statistiques récupérées pour restaurant ${activeRestaurantId || 'tous'}: ${totalCount} commandes totales, ${pendingCount} en attente, ${revenue.toFixed(2)}€ de revenus`);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [activeRestaurantId]);

  if (loading) {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques de revenus par période */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Revenus par période</h3>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 px-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          <StatisticsCard
            title="Aujourd'hui"
            value={`${todayRevenue.toFixed(2)} €`}
            icon={<TrendingUp className="h-4 w-4" />}
            description={new Date().toLocaleDateString('fr-FR')}
          />
          <StatisticsCard
            title="Hier"
            value={`${yesterdayRevenue.toFixed(2)} €`}
            icon={<TrendingUp className="h-4 w-4" />}
            description={new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
          />
          <StatisticsCard
            title="Cette semaine"
            value={`${weekRevenue.toFixed(2)} €`}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Depuis lundi"
          />
          <StatisticsCard
            title="Ce mois"
            value={`${monthRevenue.toFixed(2)} €`}
            icon={<TrendingUp className="h-4 w-4" />}
            description={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          />
        </div>
      </div>

      {/* Statistiques générales */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Statistiques générales</h3>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 px-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
          <StatisticsCard
            title="Revenu Total"
            value={`${totalRevenue.toFixed(2)} €`}
            icon={<TrendingUp className="h-4 w-4" />}
            description={activeRestaurantId ? 'Restaurant sélectionné' : 'Tous les restaurants'}
          />
          <StatisticsCard
            title="Commandes Totales"
            value={totalOrders}
            icon={<ShoppingBag className="h-4 w-4" />}
            description={activeRestaurantId ? 'Restaurant sélectionné' : 'Tous les restaurants'}
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
      </div>

      {/* Classement des produits les plus vendus */}
      <TopProductsRanking restaurantId={activeRestaurantId} />
    </div>
  );
};

export default DashboardStats;
