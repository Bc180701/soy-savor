
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
    // First, get all records from popular_products
    const { data, error } = await supabase
      .from('popular_products')
      .select('*');
    
    if (error) {
      console.error("Error fetching popular products:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Aggregate the data by product to get total counts across all dates
    const productTotals = data.reduce((acc, item) => {
      const existingProduct = acc.find(p => p.product_id === item.product_id);
      
      if (existingProduct) {
        existingProduct.order_count += item.order_count;
      } else {
        acc.push({
          product_id: item.product_id,
          product_name: item.product_name,
          order_count: item.order_count,
          date: 'aggregated' // Indicate this is an aggregated result
        });
      }
      
      return acc;
    }, [] as PopularProduct[]);
    
    // Sort by total order count and limit results
    return productTotals
      .sort((a, b) => b.order_count - a.order_count)
      .slice(0, limit);
    
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
