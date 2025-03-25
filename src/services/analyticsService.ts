
import { supabase } from "@/integrations/supabase/client";

export interface OrderAnalytics {
  date: string;
  total_orders: number;
  total_revenue: number;
}

export interface PopularProduct {
  product_id: string;
  product_name: string;
  order_count: number;
  date: string;
}

export const getOrderAnalytics = async (days = 7): Promise<OrderAnalytics[]> => {
  try {
    const { data, error } = await supabase
      .from('order_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(days);
    
    if (error) {
      console.error("Error fetching order analytics:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching order analytics:", error);
    return [];
  }
};

export const getPopularProducts = async (limit = 5): Promise<PopularProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('popular_products')
      .select('*')
      .order('order_count', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching popular products:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching popular products:", error);
    return [];
  }
};

export const getOrderCountsByStatus = async (): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('status');
    
    if (error) {
      console.error("Error fetching order statuses:", error);
      return {};
    }
    
    const counts: Record<string, number> = {};
    
    data.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error("Unexpected error fetching order counts by status:", error);
    return {};
  }
};

export const getTotalRevenue = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid');
    
    if (error) {
      console.error("Error fetching total revenue:", error);
      return 0;
    }
    
    return data.reduce((sum, order) => sum + order.total, 0);
  } catch (error) {
    console.error("Unexpected error fetching total revenue:", error);
    return 0;
  }
};
