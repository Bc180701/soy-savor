
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '@/types';
import { useRestaurantContext } from '@/hooks/useRestaurantContext';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartStore {
  items: CartItem[];
  isOrderingLocked: boolean;
  selectedRestaurantId: string | null;
  addItem: (item: MenuItem, quantity: number, specialInstructions?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setOrderingLocked: (locked: boolean) => void;
  setSelectedRestaurantId: (restaurantId: string | null) => void;
  // New properties for cart display and promotions
  itemCount: number;
  total: number;
  plateauCount: number;
  freeDessertCount: number;
  getRemainingFreeDesserts: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOrderingLocked: false,
      selectedRestaurantId: null,
      
      // Computed properties
      get itemCount() {
        return get().getTotalItems();
      },
      
      get total() {
        return get().getTotalPrice();
      },
      
      get plateauCount() {
        return get().items.filter(item => 
          item.menuItem.category === 'plateaux' || 
          item.menuItem.name.toLowerCase().includes('plateau')
        ).reduce((total, item) => total + item.quantity, 0);
      },
      
      get freeDessertCount() {
        return get().items.filter(item => 
          item.menuItem.category === 'desserts' && 
          item.menuItem.price === 0 &&
          item.specialInstructions?.includes('Dessert offert')
        ).reduce((total, item) => total + item.quantity, 0);
      },
      
      getRemainingFreeDesserts: () => {
        const state = get();
        return Math.max(0, state.plateauCount - state.freeDessertCount);
      },
      
      addItem: (item, quantity, specialInstructions) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(cartItem => cartItem.menuItem.id === item.id);
        
        if (existingItem) {
          set({
            items: currentItems.map(cartItem =>
              cartItem.menuItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + quantity }
                : cartItem
            )
          });
        } else {
          set({
            items: [...currentItems, { menuItem: item, quantity, specialInstructions }]
          });
        }
      },
      
      removeItem: (itemId) => {
        set({
          items: get().items.filter(item => item.menuItem.id !== itemId)
        });
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.menuItem.id === itemId
              ? { ...item, quantity }
              : item
          )
        });
      },
      
      clearCart: () => {
        set({ items: [], selectedRestaurantId: null });
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
      },
      
      setOrderingLocked: (locked) => {
        set({ isOrderingLocked: locked });
      },

      setSelectedRestaurantId: (restaurantId) => {
        set({ selectedRestaurantId: restaurantId });
      }
    }),
    {
      name: 'sushieats-cart',
      skipHydration: true,
    }
  )
);

// Hook personnalisé pour gérer la sélection de restaurant dans le panier
export const useCartWithRestaurant = () => {
  const cart = useCart();
  const { currentRestaurant } = useRestaurantContext();

  // Synchroniser le restaurant sélectionné avec le panier
  const addItemWithRestaurant = (item: MenuItem, quantity: number, specialInstructions?: string) => {
    if (currentRestaurant) {
      // Si le panier contient des articles d'un autre restaurant, le vider
      if (cart.selectedRestaurantId && cart.selectedRestaurantId !== currentRestaurant.id) {
        cart.clearCart();
      }
      
      cart.setSelectedRestaurantId(currentRestaurant.id);
      cart.addItem(item, quantity, specialInstructions);
    }
  };

  return {
    ...cart,
    addItem: addItemWithRestaurant,
    currentRestaurant
  };
};
