
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => void;
  removeItem: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isOrderingLocked: boolean;
  setOrderingLocked: (locked: boolean) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      isOrderingLocked: false,
      
      setOrderingLocked: (locked) => {
        set({ isOrderingLocked: locked });
      },
      
      addItem: (menuItem, quantity, specialInstructions) => {
        // Si les commandes sont verrouillées, ne pas permettre l'ajout
        if (get().isOrderingLocked) return;
        
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
    }),
    {
      name: 'sushieats-cart',
      skipHydration: true,
    }
  )
);
