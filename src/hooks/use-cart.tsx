
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '@/types';

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
  // Synchronise les sauces liées aux Sushi Push Roll avec les produits réellement présents
  syncPushRollSauces: () => void;
  // Nouvelle méthode pour vérifier la compatibilité du restaurant
  checkRestaurantCompatibility: (restaurantId: string) => boolean;
  // Nouvelle méthode pour ajouter des articles avec un restaurant spécifique
  addItemWithRestaurant: (item: MenuItem, quantity: number, restaurantId: string, specialInstructions?: string) => void;
  // Nouvelle méthode pour ajouter automatiquement un accompagnement gratuit pour les box
  addFreeAccompagnementIfBox: (item: MenuItem, state: any) => void;
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

      syncPushRollSauces: () => {
        const state = get();
        const sauceRegex = /^Sauce .+ \((.+)\)$/;
        const productQty = new Map<string, number>();
        for (const it of state.items) {
          const n = it.menuItem.name || '';
          if (!sauceRegex.test(n)) {
            productQty.set(n, (productQty.get(n) || 0) + it.quantity);
          }
        }
        const remaining = new Map(productQty);
        const newItems: typeof state.items = [];
        let changed = false;
        for (const it of state.items) {
          const n = it.menuItem.name || '';
          const m = n.match(sauceRegex);
          if (!m) { newItems.push(it); continue; }
          const product = m[1];
          const allowed = remaining.get(product) || 0;
          if (allowed <= 0) {
            console.log('🗑️ Sauce orpheline supprimée (aucun produit lié):', n);
            changed = true;
            continue;
          }
          const take = Math.min(it.quantity, allowed);
          if (take !== it.quantity) {
            console.log('🔧 Quantité sauce ajustée:', n, it.quantity, '→', take);
            newItems.push({ ...it, quantity: take });
            changed = true;
          } else {
            newItems.push(it);
          }
          remaining.set(product, allowed - take);
        }
        if (changed) {
          set({ ...state, items: newItems });
        }
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

        const pushRollSauceRegex = /^Sauce .+ \((.+)\)$/;
        const isPushRollSauce = pushRollSauceRegex.test(item.name || '');

        set((state) => {
          // Fusionner les sauces de Sushi Push Roll par nom (même sauce + même produit lié)
          if (isPushRollSauce) {
            const existingByName = state.items.find(
              ci => ci.menuItem.name === item.name
            );
            if (existingByName) {
              console.log("🛒 Fusion sauce push roll identique:", item.name);
              return {
                ...state,
                items: state.items.map(ci =>
                  ci.menuItem.name === item.name
                    ? { ...ci, quantity: ci.quantity + quantity }
                    : ci
                )
              };
            }
          }

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
        const state = get();
        const itemToRemove = state.items.find(item => item.menuItem.id === itemId);
        if (!itemToRemove) return;

        const pushRollSauceRegex = /^Sauce .+ \((.+)\)$/;
        const removedName = itemToRemove.menuItem.name || '';
        const sauceMatch = removedName.match(pushRollSauceRegex);

        let newItems = state.items.filter(item => item.menuItem.id !== itemId);

        if (sauceMatch) {
          // Suppression d'une sauce push roll → décrémente d'autant le produit lié
          const linkedProductName = sauceMatch[1];
          const decrementBy = itemToRemove.quantity;
          newItems = newItems
            .map(item => {
              if (item.menuItem.name === linkedProductName) {
                const newQty = item.quantity - decrementBy;
                if (newQty <= 0) {
                  console.log("🗑️ Suppression produit lié (sauce supprimée):", linkedProductName);
                  return null;
                }
                console.log("🔻 Décrément produit lié:", linkedProductName, item.quantity, "→", newQty);
                return { ...item, quantity: newQty };
              }
              return item;
            })
            .filter(Boolean) as typeof newItems;
        } else {
          // Suppression d'un produit → supprimer toutes les sauces liées
          const productName = removedName;
          newItems = newItems.filter(item => {
            const name = item.menuItem.name || '';
            const m = name.match(pushRollSauceRegex);
            if (m && m[1] === productName) {
              console.log("🗑️ Suppression sauce liée:", name);
              return false;
            }
            return true;
          });
        }

        set({ ...state, items: newItems });
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        console.log("🛒 Mise à jour quantité:", itemId, "nouvelle quantité:", quantity);

        const state = get();
        const target = state.items.find(it => it.menuItem.id === itemId);
        if (!target) return;

        const pushRollSauceRegex = /^Sauce .+ \((.+)\)$/;
        const sauceMatch = (target.menuItem.name || '').match(pushRollSauceRegex);

        let newItems = state.items.map(item =>
          item.menuItem.id === itemId ? { ...item, quantity } : item
        );

        if (sauceMatch) {
          // Modification de quantité sur une sauce push roll
          const linkedProductName = sauceMatch[1];
          const delta = quantity - target.quantity;

          if (delta < 0) {
            // Décrémentation sauce → décrémenter d'autant le produit lié
            newItems = newItems
              .map(item => {
                if (item.menuItem.name === linkedProductName) {
                  const newQty = item.quantity + delta; // delta négatif
                  if (newQty <= 0) {
                    console.log("🗑️ Produit lié supprimé (qté sauce réduite):", linkedProductName);
                    return null;
                  }
                  return { ...item, quantity: newQty };
                }
                return item;
              })
              .filter(Boolean) as typeof newItems;
          } else if (delta > 0) {
            // Plafonner la sauce à la quantité du produit lié
            const productItem = newItems.find(it => it.menuItem.name === linkedProductName);
            const maxAllowed = productItem ? productItem.quantity : 0;
            if (quantity > maxAllowed) {
              console.log("🔧 Sauce plafonnée à la quantité du produit:", quantity, "→", maxAllowed);
              newItems = newItems.map(item =>
                item.menuItem.id === itemId ? { ...item, quantity: maxAllowed } : item
              );
            }
          }
        }

        set({ ...state, items: newItems });

        // Si on a modifié un produit (non-sauce), aligner les sauces liées
        if (!sauceMatch) {
          get().syncPushRollSauces();
        }
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
      },

      addFreeAccompagnementIfBox: (item, currentState) => {
        // Cette méthode n'est plus utilisée car remplacée par le popup de sélection
        // Gardée pour compatibilité mais ne fait rien
        return;
      }
    }),
    {
      name: 'sushieats-cart',
    }
  )
);

// Hydrater le store au chargement
if (typeof window !== 'undefined') {
  useCart.persist.rehydrate();
}

// Hook personnalisé pour obtenir le total de manière réactive
export const useCartTotal = () => {
  const cart = useCart();
  
  // Forcer le recalcul en accédant aux items
  const total = cart.items.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  
  console.log("💰 useCartTotal - Total calculé:", total, "€");
  return total;
};

// Note: useCartWithRestaurant hook has been moved to avoid circular dependency
