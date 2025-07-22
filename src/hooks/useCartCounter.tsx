
import { useCart } from '@/hooks/use-cart';
import { useMemo } from 'react';

export const useCartCounter = () => {
  const { items } = useCart();
  
  const itemCount = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    console.log("🔢 Calcul compteur panier:", items.length, "articles distincts,", total, "quantité totale");
    return total;
  }, [items]);

  return { itemCount };
};
