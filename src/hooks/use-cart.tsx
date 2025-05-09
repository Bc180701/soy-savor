
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '@/types';
import { supabase } from "@/integrations/supabase/client";

interface CartStore {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => void;
  removeItem: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  initiateSumUpPayment: (orderId: string, customerEmail: string) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  total: number;
  itemCount: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      
      addItem: (menuItem, quantity, specialInstructions) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.menuItem.id === menuItem.id
          );

          let updatedItems;
          
          if (existingItemIndex !== -1) {
            // L'item existe déjà, on met à jour la quantité
            updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            
            if (specialInstructions) {
              updatedItems[existingItemIndex].specialInstructions = specialInstructions;
            }
          } else {
            // Nouvel item
            updatedItems = [
              ...state.items,
              { menuItem, quantity, specialInstructions },
            ];
          }
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      removeItem: (id) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.menuItem.id !== id);
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      incrementQuantity: (id) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      decrementQuantity: (id) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === id && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === id ? { ...item, quantity } : item
          );
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      updateInstructions: (id, instructions) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === id ? { ...item, specialInstructions: instructions } : item
          );
          return { items: updatedItems };
        });
      },
      
      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },
      
      initiateSumUpPayment: async (orderId, customerEmail) => {
        try {
          const { items, total } = get();
          const returnUrl = window.location.origin;
          
          console.log("Initiating SumUp payment:", { orderId, customerEmail, total, returnUrl });
          
          const { data, error } = await supabase.functions.invoke('create-sumup-checkout', {
            body: {
              orderData: {
                orderId,
                items,
                total,
                customerEmail,
                returnUrl
              }
            }
          });
          
          console.log("SumUp payment response:", data, error);
          
          if (error) {
            console.error('Error initiating SumUp payment:', error);
            return { 
              success: false, 
              error: error.message || 'Échec de l\'initialisation du paiement' 
            };
          }
          
          if (!data.success || !data.redirectUrl) {
            console.error('SumUp payment initialization failed:', data);
            return { 
              success: false, 
              error: data.error || 'Échec de l\'initialisation du paiement SumUp' 
            };
          }
          
          console.log("SumUp redirect URL:", data.redirectUrl);
          
          return { success: true, redirectUrl: data.redirectUrl };
        } catch (err) {
          console.error('Error in initiateSumUpPayment:', err);
          return { 
            success: false, 
            error: err instanceof Error ? err.message : 'Une erreur est survenue' 
          };
        }
      },
    }),
    {
      name: 'sushieats-cart',
      skipHydration: true,
    }
  )
);
