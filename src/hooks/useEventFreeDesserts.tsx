import { useMemo } from 'react';
import { CartItem } from '@/hooks/use-cart';
import { useCartEventProducts } from './useCartEventProducts';
import { useCart } from '@/hooks/use-cart';

interface FreeDessertInfo {
  isFreeDessert: boolean;
  originalPrice: number;
  eventName: string | null;
}

// Vérifier si un item est un dessert (catégorie contient "dessert")
const isDessertItem = (category: string): boolean => {
  return category?.toLowerCase().includes('dessert');
};

// Vérifier si un item est une boisson (catégorie contient "boisson")
const isBoissonItem = (category: string): boolean => {
  return category?.toLowerCase().includes('boisson');
};

export const useEventFreeDesserts = (restaurantId?: string) => {
  const { items } = useCart();
  const cartEventInfo = useCartEventProducts(restaurantId);

  // Compter le nombre de produits événement dans le panier (en tenant compte des quantités)
  const eventProductsCount = useMemo(() => {
    if (!cartEventInfo.hasEventProducts || !cartEventInfo.eventProductIds.length) {
      return 0;
    }
    
    return items.reduce((count, item) => {
      if (cartEventInfo.eventProductIds.includes(item.menuItem?.id)) {
        return count + item.quantity;
      }
      return count;
    }, 0);
  }, [items, cartEventInfo.eventProductIds, cartEventInfo.hasEventProducts]);

  // Identifier quels desserts sont offerts (limité au nombre de produits événement)
  const freeDessertItemIds = useMemo(() => {
    if (!cartEventInfo.freeDessertsEnabled || !cartEventInfo.hasEventProducts || eventProductsCount === 0) {
      return new Set<string>();
    }

    const freeIds = new Set<string>();
    let remainingFreeSlots = eventProductsCount;

    // Parcourir les items du panier et marquer les desserts comme offerts
    for (const item of items) {
      if (remainingFreeSlots <= 0) break;
      
      const category = item.menuItem?.category || '';
      if (isDessertItem(category) && !isBoissonItem(category)) {
        // Calculer combien de ce dessert peuvent être offerts
        const freeQuantity = Math.min(item.quantity, remainingFreeSlots);
        if (freeQuantity > 0) {
          freeIds.add(item.menuItem.id);
          remainingFreeSlots -= freeQuantity;
        }
      }
    }

    return freeIds;
  }, [items, cartEventInfo.freeDessertsEnabled, cartEventInfo.hasEventProducts, eventProductsCount]);

  // Vérifier si un item doit avoir un prix réduit à 0 (et combien d'unités)
  const getFreeDessertInfo = (item: CartItem): FreeDessertInfo & { freeQuantity: number } => {
    const category = item.menuItem?.category || '';
    
    if (cartEventInfo.freeDessertsEnabled && cartEventInfo.hasEventProducts && eventProductsCount > 0) {
      if (isDessertItem(category) && !isBoissonItem(category)) {
        // Calculer combien de desserts gratuits restent avant cet item
        let freeSlotsBefore = eventProductsCount;
        
        for (const otherItem of items) {
          if (otherItem.menuItem.id === item.menuItem.id) break;
          
          const otherCategory = otherItem.menuItem?.category || '';
          if (isDessertItem(otherCategory) && !isBoissonItem(otherCategory)) {
            freeSlotsBefore -= otherItem.quantity;
          }
        }

        const freeQuantity = Math.max(0, Math.min(item.quantity, freeSlotsBefore));
        
        if (freeQuantity > 0) {
          return {
            isFreeDessert: true,
            originalPrice: item.menuItem.price,
            eventName: cartEventInfo.eventName,
            freeQuantity,
          };
        }
      }
    }
    
    return {
      isFreeDessert: false,
      originalPrice: item.menuItem.price,
      eventName: null,
      freeQuantity: 0,
    };
  };

  // Calculer la réduction totale grâce aux desserts offerts
  const calculateDessertDiscount = (cartItems: CartItem[]): number => {
    if (!cartEventInfo.freeDessertsEnabled || !cartEventInfo.hasEventProducts || eventProductsCount === 0) {
      return 0;
    }

    let discount = 0;
    let remainingFreeSlots = eventProductsCount;

    for (const item of cartItems) {
      if (remainingFreeSlots <= 0) break;
      
      const category = item.menuItem?.category || '';
      if (isDessertItem(category) && !isBoissonItem(category)) {
        const freeQuantity = Math.min(item.quantity, remainingFreeSlots);
        discount += item.menuItem.price * freeQuantity;
        remainingFreeSlots -= freeQuantity;
      }
    }

    return discount;
  };

  return {
    freeDessertsEnabled: cartEventInfo.freeDessertsEnabled && cartEventInfo.hasEventProducts,
    eventName: cartEventInfo.eventName,
    eventProductsCount,
    getFreeDessertInfo,
    calculateDessertDiscount,
    isDessertItem,
    isBoissonItem,
  };
};
