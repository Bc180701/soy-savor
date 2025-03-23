
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface OrderData {
  items: CartItem[];
  total: number;
  date: string;
}

interface OrderStore {
  orders: OrderData[];
  createOrder: (orderData: OrderData) => void;
  clearOrders: () => void;
}

export const useOrder = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      
      createOrder: (orderData) => {
        set((state) => ({
          orders: [...state.orders, orderData]
        }));
      },
      
      clearOrders: () => {
        set({ orders: [] });
      }
    }),
    {
      name: 'sushieats-orders',
      skipHydration: true,
    }
  )
);
