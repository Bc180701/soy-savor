
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (menuItem, quantity, specialInstructions) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.menuItem.id === menuItem.id
          );

          if (existingItemIndex !== -1) {
            // L'item existe déjà, on met à jour la quantité
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            
            if (specialInstructions) {
              updatedItems[existingItemIndex].specialInstructions = specialInstructions;
            }
            
            return { items: updatedItems };
          } else {
            // Nouvel item
            return {
              items: [
                ...state.items,
                { menuItem, quantity, specialInstructions },
              ],
            };
          }
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.menuItem.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.menuItem.id === id ? { ...item, quantity } : item
          ),
        }));
      },
      
      updateInstructions: (id, instructions) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.menuItem.id === id ? { ...item, specialInstructions: instructions } : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.menuItem.price * item.quantity,
          0
        );
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'sushieats-cart',
      skipHydration: true,
    }
  )
);
