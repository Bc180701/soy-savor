
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '@/types';
import { useRestaurantContext } from '@/hooks/useRestaurantContext';
import { RESTAURANTS } from '@/services/restaurantService';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

// Fonction pour détecter le restaurant depuis la catégorie
const detectRestaurantFromCategory = (category: string): string => {
  const categoryMapping: { [key: string]: string } = {
    'box_du_midi': RESTAURANTS.CHATEAURENARD,
    'sushis': RESTAURANTS.CHATEAURENARD,
    'makis': RESTAURANTS.CHATEAURENARD,
    'california': RESTAURANTS.CHATEAURENARD,
    'spring': RESTAURANTS.CHATEAURENARD,
    'sashimis': RESTAURANTS.CHATEAURENARD,
    'chirashis': RESTAURANTS.CHATEAURENARD,
    'plateaux': RESTAURANTS.CHATEAURENARD,
    'accompagnements': RESTAURANTS.CHATEAURENARD,
    'desserts': RESTAURANTS.CHATEAURENARD,
    'boissons': RESTAURANTS.CHATEAURENARD,
    'entrees': RESTAURANTS.CHATEAURENARD,
    'soupes': RESTAURANTS.CHATEAURENARD,
    'stmartin_sushis': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_makis': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_california': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_plateaux': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_accompagnements': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_desserts': RESTAURANTS.ST_MARTIN_DE_CRAU,
    'stmartin_boissons': RESTAURANTS.ST_MARTIN_DE_CRAU,
  };

  if (categoryMapping[category]) {
    return categoryMapping[category];
  }

  if (category.includes('stmartin') || category.includes('st_martin')) {
    return RESTAURANTS.ST_MARTIN_DE_CRAU;
  }

  // Par défaut, assigner à Châteaurenard
  return RESTAURANTS.CHATEAURENARD;
};

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
  // Nouvelle méthode pour ajouter des articles avec un restaurant spécifique
  addItemWithRestaurant: (item: MenuItem, quantity: number, restaurantId: string, specialInstructions?: string) => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOrderingLocked: false,
      selectedRestaurantId: null,
      
      // Computed properties - maintenant calculées à chaque fois de manière réactive
      get itemCount() {
        const state = get();
        const totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
        console.log("🛒 Calcul itemCount:", state.items.length, "articles distincts,", totalQuantity, "quantité totale");
        return totalQuantity;
      },
      
      get total() {
        const state = get();
        const totalPrice = state.items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
        console.log("💰 Calcul total panier:", totalPrice, "€ pour", state.items.length, "articles");
        return totalPrice;
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
        const currentItems = get().items;
        
        // S'assurer que l'article a un restaurant_id
        if (!item.restaurant_id) {
          const detectedRestaurantId = detectRestaurantFromCategory(item.category);
          item = {
            ...item,
            restaurant_id: detectedRestaurantId
          };
        }
        
        // Définir le restaurant sélectionné si ce n'est pas déjà fait
        const state = get();
        if (!state.selectedRestaurantId && item.restaurant_id) {
          get().setSelectedRestaurantId(item.restaurant_id);
        }
        
        const existingItem = currentItems.find(cartItem => cartItem.menuItem.id === item.id);
        
        if (existingItem) {
          console.log("🛒 Mise à jour quantité article existant:", item.name, "nouvelle quantité:", existingItem.quantity + quantity);
          set((state) => ({
            items: state.items.map(cartItem =>
              cartItem.menuItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + quantity }
                : cartItem
            )
          }));
        } else {
          console.log("🛒 Ajout nouvel article:", item.name, "quantité:", quantity);
          set((state) => ({
            items: [...state.items, { menuItem: item, quantity, specialInstructions }]
          }));
        }
      },
      
      removeItem: (itemId) => {
        console.log("🛒 Suppression article:", itemId);
        set((state) => ({
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

// Hook personnalisé pour obtenir le total de manière réactive
export const useCartTotal = () => {
  const cart = useCart();
  
  // Forcer le recalcul en accédant aux items
  const total = cart.items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  
  console.log("💰 useCartTotal - Total calculé:", total, "€");
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
      
      // Ajouter l'article avec le restaurant_id
      const itemWithRestaurant = {
        ...item,
        restaurant_id: currentRestaurant.id
      };
      
      cart.addItem(itemWithRestaurant, quantity, specialInstructions);
    }
  };

  return {
    ...cart,
    addItem: addItemWithRestaurant,
    currentRestaurant
  };
};
