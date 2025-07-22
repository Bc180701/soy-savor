
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
  getRemainingFreeDesserts: () => number;
  checkRestaurantCompatibility: (restaurantId: string) => boolean;
  addItemWithRestaurant: (item: MenuItem, quantity: number, restaurantId: string, specialInstructions?: string) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOrderingLocked: false,
      selectedRestaurantId: null,
      
      getRemainingFreeDesserts: () => {
        const state = get();
        const plateauCount = state.items.filter(item => 
          item.menuItem.category === 'plateaux' || 
          item.menuItem.name.toLowerCase().includes('plateau')
        ).reduce((total, item) => total + item.quantity, 0);
        
        const freeDessertCount = state.items.filter(item => 
          item.menuItem.category === 'desserts' && 
          item.menuItem.price === 0 &&
          item.specialInstructions?.includes('Dessert offert')
        ).reduce((total, item) => total + item.quantity, 0);
        
        return Math.max(0, plateauCount - freeDessertCount);
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

      addItemWithRestaurant: (item, quantity, restaurantId, specialInstructions) => {
        const state = get();
        
        console.log("🛒 Ajout article avec restaurant:", item.name, "Restaurant:", restaurantId);
        
        // Vérifier la compatibilité avec le restaurant
        if (!state.checkRestaurantCompatibility(restaurantId)) {
          console.log("⚠️ Restaurant incompatible, vidage du panier");
          get().clearCart();
        }
        
        // Définir le restaurant sélectionné si ce n'est pas déjà fait
        if (!state.selectedRestaurantId) {
          get().setSelectedRestaurantId(restaurantId);
        }
        
        // Ajouter l'article avec le restaurant_id
        const itemWithRestaurant = {
          ...item,
          restaurant_id: restaurantId
        };
        
        get().addItem(itemWithRestaurant, quantity, specialInstructions);
      },
      
      addItem: (item, quantity, specialInstructions) => {
        console.log("🛒 addItem appelé:", item.name, "quantité:", quantity);
        
        set((state) => {
          const existingItem = state.items.find(cartItem => cartItem.menuItem.id === item.id);
          
          if (existingItem) {
            console.log("🛒 Mise à jour quantité article existant:", item.name, "nouvelle quantité:", existingItem.quantity + quantity);
            return {
              ...state,
              items: state.items.map(cartItem =>
                cartItem.menuItem.id === item.id
                  ? { ...cartItem, quantity: cartItem.quantity + quantity }
                  : cartItem
              )
            };
          } else {
            console.log("🛒 Ajout nouvel article:", item.name, "quantité:", quantity);
            return {
              ...state,
              items: [...state.items, { menuItem: item, quantity, specialInstructions }]
            };
          }
        });
      },
      
      removeItem: (itemId) => {
        console.log("🛒 Suppression article:", itemId);
        set((state) => ({
          ...state,
          items: state.items.filter(item => item.menuItem.id !== itemId)
        }));
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        console.log("🛒 Mise à jour quantité:", itemId, "nouvelle quantité:", quantity);
        set((state) => ({
          ...state,
          items: state.items.map(item =>
            item.menuItem.id === itemId
              ? { ...item, quantity }
              : item
          )
        }));
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

// Hook personnalisé pour obtenir le total de manière réactive et stable
export const useCartTotal = () => {
  const items = useCart(state => state.items);
  
  // Calcul stable qui ne change que si les items changent vraiment
  const total = items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  
  return total;
};

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
