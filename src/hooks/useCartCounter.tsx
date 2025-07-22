
import { useCart } from '@/hooks/use-cart';

export const useCartCounter = () => {
  // Utiliser le sélecteur Zustand pour éviter les re-rendus inutiles
  const itemCount = useCart(state => 
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  return { itemCount };
};
