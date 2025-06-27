
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
  // Properties calculées réactives
  itemCount: number;
  total: number;
  plateauCount: number;
  freeDessertCount: number;
  getRemainingFreeDesserts: () => number;
  // Nouvelle méthode pour vérifier la compatibilité du restaurant
  checkRestaurantCompatibility: (restaurantId: string) => boolean;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOrderingLocked: false,
      selectedRestaurantId: null,
      
      // Computed properties - maintenant calculées à chaque fois
      get itemCount() {
        const state = get();
        const totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
        console.log("🛒 Calcul itemCount:", state.items.length, "articles distincts,", totalQuantity, "quantité totale");
        return totalQuantity;
      },
      
      get total() {
        return get().items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
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

      checkRestaurantCompatibility: (restaurantId: string) => {
        const state = get();
        // Si le panier est vide, n'importe quel restaurant est compatible
        if (state.items.length === 0) return true;
        // Si aucun restaurant n'est sélectionné dans le panier, compatible
        if (!state.selectedRestaurantId) return true;
        // Sinon, vérifier que c'est le même restaurant
        return state.selectedRestaurantId === restaurantId;
      },
      
      addItem: (item, quantity, specialInstructions) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(cartItem => cartItem.menuItem.id === item.id);
        
        if (existingItem) {
          console.log("🛒 Mise à jour quantité article existant:", item.name, "nouvelle quantité:", existingItem.quantity + quantity);
          set({
            items: currentItems.map(cartItem =>
              cartItem.menuItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + quantity }
                : cartItem
            )
          });
        } else {
          console.log("🛒 Ajout nouvel article:", item.name, "quantité:", quantity);
          set({
            items: [...currentItems, { menuItem: item, quantity, specialInstructions }]
          });
        }
      },
      
      removeItem: (itemId) => {
        console.log("🛒 Suppression article:", itemId);
        set({
          items: get().items.filter(item => item.menuItem.id !== itemId)
        });
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        console.log("🛒 Mise à jour quantité:", itemId, "nouvelle quantité:", quantity);
        set({
          items: get().items.map(item =>
            item.menuItem.id === itemId
              ? { ...item, quantity }
              : item
          )
        });
      },
      
      clearCart: () => {
        console.log("🧹 Vidage du panier");
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
        console.log("🏪 Restaurant sélectionné dans le panier:", restaurantId);
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
      console.log("🛒 Ajout d'un article au panier:", item.name, "Restaurant:", currentRestaurant.name);
      
      // Vérifier la compatibilité avec le restaurant courant
      if (!cart.checkRestaurantCompatibility(currentRestaurant.id)) {
        console.log("⚠️ Restaurant incompatible, vidage du panier");
        cart.clearCart();
      }
      
      // Définir le restaurant sélectionné si ce n'est pas déjà fait
      if (!cart.selectedRestaurantId) {
        cart.setSelectedRestaurantId(currentRestaurant.id);
      }
      
      cart.addItem(item, quantity, specialInstructions);
    }
  };

  return {
    ...cart,
    addItem: addItemWithRestaurant,
    currentRestaurant
  };
};
