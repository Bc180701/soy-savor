import { useState, useEffect } from "react";

const STORAGE_KEY = 'admin-restaurant-session';

export const useAdminRestaurantSession = () => {
  const [sessionRestaurant, setSessionRestaurant] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const selectRestaurant = (restaurantId: string) => {
    localStorage.setItem(STORAGE_KEY, restaurantId);
    setSessionRestaurant(restaurantId);
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionRestaurant(null);
  };

  return { 
    sessionRestaurant, 
    selectRestaurant, 
    clearSession 
  };
};
