
export interface Restaurant {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RestaurantContext {
  currentRestaurant: Restaurant | null;
  restaurants: Restaurant[];
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  isLoading: boolean;
}
