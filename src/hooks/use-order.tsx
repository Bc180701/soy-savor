
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderType, UserAddress } from '@/types';

interface OrderSettings {
  orderType: OrderType['id'];
  scheduledTime: string;
  scheduledDate: Date | null;
  selectedAddress: UserAddress | null;
  deliveryInstructions: string;
  paymentMethod: 'credit-card' | 'cash' | 'paypal';
  promoCode: string;
  tip: number;
}

interface OrderStore {
  settings: OrderSettings;
  setOrderType: (type: OrderType['id']) => void;
  setScheduledTime: (time: string) => void;
  setScheduledDate: (date: Date | null) => void;
  setSelectedAddress: (address: UserAddress | null) => void;
  setDeliveryInstructions: (instructions: string) => void;
  setPaymentMethod: (method: 'credit-card' | 'cash' | 'paypal') => void;
  setPromoCode: (code: string) => void;
  setTip: (amount: number) => void;
  resetOrderSettings: () => void;
}

const initialSettings: OrderSettings = {
  orderType: 'delivery',
  scheduledTime: '',
  scheduledDate: null,
  selectedAddress: null,
  deliveryInstructions: '',
  paymentMethod: 'credit-card',
  promoCode: '',
  tip: 0,
};

export const useOrder = create<OrderStore>()(
  persist(
    (set) => ({
      settings: initialSettings,
      
      setOrderType: (type) => 
        set((state) => ({ 
          settings: { ...state.settings, orderType: type } 
        })),
      
      setScheduledTime: (time) => 
        set((state) => ({ 
          settings: { ...state.settings, scheduledTime: time } 
        })),
      
      setScheduledDate: (date) => 
        set((state) => ({ 
          settings: { ...state.settings, scheduledDate: date } 
        })),
      
      setSelectedAddress: (address) => 
        set((state) => ({ 
          settings: { ...state.settings, selectedAddress: address } 
        })),
      
      setDeliveryInstructions: (instructions) => 
        set((state) => ({ 
          settings: { ...state.settings, deliveryInstructions: instructions } 
        })),
      
      setPaymentMethod: (method) => 
        set((state) => ({ 
          settings: { ...state.settings, paymentMethod: method } 
        })),
      
      setPromoCode: (code) => 
        set((state) => ({ 
          settings: { ...state.settings, promoCode: code } 
        })),
      
      setTip: (amount) => 
        set((state) => ({ 
          settings: { ...state.settings, tip: amount } 
        })),
      
      resetOrderSettings: () => 
        set({ settings: initialSettings }),
    }),
    {
      name: 'sushieats-order',
      skipHydration: true,
    }
  )
);
