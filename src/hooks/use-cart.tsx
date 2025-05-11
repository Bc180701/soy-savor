
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, CartItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface CartStore {
  items: CartItem[];
  total: number;
  itemCount: number; // Added this property to fix the error
  add: (item: CartItem) => void;
  addItem: (menuItem: MenuItem, quantity: number) => void; // Added this method
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
      itemCount: 0, // Initialize the itemCount property

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
            itemCount: get().items.reduce((total, item) => total + item.quantity, 0)
          });
        } else {
          // Add new item
          set({ 
            items: [...items, item],
            total: get().calculateTotal() + item.menuItem.price * item.quantity,
            itemCount: get().items.length + 1
          });
        }
      },
      
      // Add a menu item to the cart
      addItem: (menuItem, quantity) => {
        const { items } = get();
        const cartItem: CartItem = {
          menuItem,
          quantity,
          specialInstructions: ''
        };
        
        const existingItemIndex = items.findIndex(
          (item) => item.menuItem.id === menuItem.id
        );

        if (existingItemIndex > -1) {
          // If item already exists, update quantity
          const newItems = [...items];
          newItems[existingItemIndex].quantity += quantity;
          set({ 
            items: newItems,
            total: get().calculateTotal(),
            itemCount: get().items.reduce((total, item) => total + item.quantity, 0)
          });
        } else {
          // Add new item
          set({ 
            items: [...items, cartItem],
            total: get().calculateTotal() + menuItem.price * quantity,
            itemCount: get().items.reduce((total, item) => total + item.quantity, 0) + quantity
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
          itemCount: newItems.reduce((total, item) => total + item.quantity, 0)
        });
      },

      // Remove an item from the cart
      removeItem: (id) => {
        const { items } = get();
        const newItems = items.filter((item) => item.menuItem.id !== id);
        set({ 
          items: newItems,
          total: get().calculateTotal(),
          itemCount: newItems.reduce((total, item) => total + item.quantity, 0)
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
          itemCount: newItems.reduce((total, item) => total + item.quantity, 0)
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
          itemCount: newItems.reduce((total, item) => total + item.quantity, 0)
        });
      },

      // Clear the entire cart
      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
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
        const itemCount = get().items.reduce((count, item) => count + item.quantity, 0);
        set({ total, itemCount });
      },

      // Initialize cart from local storage
      initializeFromLocalStorage: () => {
        // If hydration fails, we need to recalculate the total
        const total = get().calculateTotal();
        const itemCount = get().items.reduce((count, item) => count + item.quantity, 0);
        set({ total, itemCount });
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
