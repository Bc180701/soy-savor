
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, CartItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface CartStore {
  items: CartItem[];
  total: number;
  add: (item: CartItem) => void;
  update: (id: string, item: CartItem) => void;
  removeItem: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  clearCart: () => void;
  calculateTotal: () => number;
  initializeCart: () => void;
  initializeFromLocalStorage: () => void;
  initializeStripePayment: (orderId: string, customerEmail: string) => Promise<{
    success: boolean;
    redirectUrl?: string;
    checkoutId?: string;
    error?: string;
  }>;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      // Add an item to the cart
      add: (item) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (cartItem) => cartItem.menuItem.id === item.menuItem.id
        );

        if (existingItemIndex > -1) {
          // If item already exists, update quantity
          const newItems = [...items];
          newItems[existingItemIndex].quantity += item.quantity;
          set({ 
            items: newItems,
            total: get().calculateTotal(),
          });
        } else {
          // Add new item
          set({ 
            items: [...items, item],
            total: get().calculateTotal() + item.menuItem.price * item.quantity,
          });
        }
      },

      // Update an item in the cart
      update: (id, updatedItem) => {
        const { items } = get();
        const newItems = items.map(item => 
          item.menuItem.id === id ? updatedItem : item
        );
        
        set({ 
          items: newItems,
          total: get().calculateTotal(),
        });
      },

      // Remove an item from the cart
      removeItem: (id) => {
        const { items } = get();
        set({ 
          items: items.filter((item) => item.menuItem.id !== id),
          total: get().calculateTotal(),
        });
      },

      // Increment the quantity of an item
      incrementQuantity: (id) => {
        const { items } = get();
        const newItems = items.map((item) => {
          if (item.menuItem.id === id) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });

        set({ 
          items: newItems,
          total: get().calculateTotal(),
        });
      },

      // Decrement the quantity of an item
      decrementQuantity: (id) => {
        const { items } = get();
        const newItems = items.map((item) => {
          if (item.menuItem.id === id && item.quantity > 1) {
            return { ...item, quantity: item.quantity - 1 };
          }
          return item;
        });

        set({ 
          items: newItems,
          total: get().calculateTotal(),
        });
      },

      // Clear the entire cart
      clearCart: () => {
        set({ items: [], total: 0 });
      },

      // Calculate the total price of the cart
      calculateTotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.menuItem.price * item.quantity,
          0
        );
      },

      // Initialize the cart
      initializeCart: () => {
        const total = get().calculateTotal();
        set({ total });
      },

      // Initialize cart from local storage
      initializeFromLocalStorage: () => {
        // If hydration fails, we need to recalculate the total
        const total = get().calculateTotal();
        set({ total });
      },

      // Initiate Stripe payment
      initializeStripePayment: async (orderId, customerEmail) => {
        try {
          const { items, total } = get();
          
          // Get origin for return URL
          const origin = window.location.origin;

          const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
            body: {
              orderData: {
                items,
                total,
                orderId,
                customerEmail,
                returnUrl: origin,
              }
            }
          });

          if (error || !data.success) {
            console.error("Erreur lors de l'initialisation du paiement Stripe:", error || data.error);
            return { 
              success: false, 
              error: error?.message || data?.error || "Erreur lors de l'initialisation du paiement"
            };
          }

          return {
            success: true,
            redirectUrl: data.redirectUrl,
            checkoutId: data.checkoutId,
          };
        } catch (error) {
          console.error("Exception lors de l'initialisation du paiement Stripe:", error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : "Erreur inconnue"
          };
        }
      }
    }),
    {
      name: 'sushieats-cart',
      skipHydration: true,
    }
  )
);
