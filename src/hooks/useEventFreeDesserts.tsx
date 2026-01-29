import { useMemo } from 'react';
import { CartItem } from '@/hooks/use-cart';
import { useCartEventProducts } from './useCartEventProducts';

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
  const cartEventInfo = useCartEventProducts(restaurantId);

  // Vérifier si un item doit avoir un prix réduit à 0
  const getFreeDessertInfo = (item: CartItem): FreeDessertInfo => {
    const category = item.menuItem?.category || '';
    
    // Si l'offre desserts offerts est active ET qu'il y a des produits événement dans le panier
    if (cartEventInfo.freeDessertsEnabled && cartEventInfo.hasEventProducts) {
      // Seuls les desserts sont offerts, pas les boissons
      if (isDessertItem(category) && !isBoissonItem(category)) {
        return {
          isFreeDessert: true,
          originalPrice: item.menuItem.price,
          eventName: cartEventInfo.eventName,
        };
      }
    }
    
    return {
      isFreeDessert: false,
      originalPrice: item.menuItem.price,
      eventName: null,
    };
  };

  // Appliquer les prix gratuits aux desserts dans une liste d'items
  const applyFreeDessertPrices = (items: CartItem[]): CartItem[] => {
    if (!cartEventInfo.freeDessertsEnabled || !cartEventInfo.hasEventProducts) {
      return items;
    }

    return items.map(item => {
      const info = getFreeDessertInfo(item);
      if (info.isFreeDessert) {
        return {
          ...item,
          menuItem: {
            ...item.menuItem,
            price: 0,
            originalPrice: info.originalPrice,
          },
          specialInstructions: item.specialInstructions 
            ? `${item.specialInstructions} - Dessert offert (${info.eventName})`
            : `Dessert offert (${info.eventName})`,
        };
      }
      return item;
    });
  };

  // Calculer le total avec les desserts offerts
  const calculateTotalWithFreeDesserts = (items: CartItem[]): number => {
    return items.reduce((total, item) => {
      const info = getFreeDessertInfo(item);
      const price = info.isFreeDessert ? 0 : item.menuItem.price;
      return total + (price * item.quantity);
    }, 0);
  };

  // Calculer la réduction totale grâce aux desserts offerts
  const calculateDessertDiscount = (items: CartItem[]): number => {
    if (!cartEventInfo.freeDessertsEnabled || !cartEventInfo.hasEventProducts) {
      return 0;
    }

    return items.reduce((discount, item) => {
      const info = getFreeDessertInfo(item);
      if (info.isFreeDessert) {
        return discount + (info.originalPrice * item.quantity);
      }
      return discount;
    }, 0);
  };

  return {
    freeDessertsEnabled: cartEventInfo.freeDessertsEnabled && cartEventInfo.hasEventProducts,
    eventName: cartEventInfo.eventName,
    getFreeDessertInfo,
    applyFreeDessertPrices,
    calculateTotalWithFreeDesserts,
    calculateDessertDiscount,
    isDessertItem,
    isBoissonItem,
  };
};
