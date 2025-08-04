import { MenuItem } from '@/types';
import { useCart } from '@/hooks/use-cart';
import { useRestaurantContext } from '@/hooks/useRestaurantContext';

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