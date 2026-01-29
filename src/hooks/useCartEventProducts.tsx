import { useMemo } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useSpecialEvents, SpecialEvent, EventTimeSlot } from '@/hooks/useSpecialEvents';

interface CartEventInfo {
  hasEventProducts: boolean;
  hasNonEventProducts: boolean;
  event: SpecialEvent | null;
  eventDate: string | null;
  eventName: string | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  eventTimeSlots: EventTimeSlot[];
  eventProductIds: string[];
  freeDessertsEnabled: boolean;
}

// Helper function to check if a category is allowed with event products
// Uses partial matching to handle suffixed categories like "desserts_stmartin"
const isAllowedCategoryWithEvent = (categoryId: string): boolean => {
  const allowedKeywords = ['desserts', 'boissons'];
  return allowedKeywords.some(keyword => 
    categoryId.toLowerCase().includes(keyword)
  );
};

export const useCartEventProducts = (restaurantId?: string): CartEventInfo => {
  const { items } = useCart();
  const { activeEvents, eventProducts, isEventProduct, getEventProductIds } = useSpecialEvents(restaurantId);

  const cartEventInfo = useMemo(() => {
    // Default values
    const defaultInfo: CartEventInfo = {
      hasEventProducts: false,
      hasNonEventProducts: false,
      event: null,
      eventDate: null,
      eventName: null,
      deliveryEnabled: true,
      pickupEnabled: true,
      eventTimeSlots: [],
      eventProductIds: [],
      freeDessertsEnabled: false,
    };

    if (!items.length) {
      return defaultInfo;
    }

    let foundEvent: SpecialEvent | null = null;
    let hasEventProducts = false;
    let hasNonEventProducts = false;

    // Check each cart item
    for (const item of items) {
      const productId = item.menuItem?.id;
      const productCategory = item.menuItem?.category;
      const productName = item.menuItem?.name || 'Produit';
      
      if (!productId) continue;
      
      const event = isEventProduct(productId);
      
      if (event) {
        console.log('🎄 Event product found in cart:', productName, 'Event:', event.name);
        hasEventProducts = true;
        foundEvent = event;
      } else if (!isAllowedCategoryWithEvent(productCategory || '')) {
        // This is a non-event product (not dessert/boisson)
        console.log('📦 Non-event product found in cart:', productName, 'Category:', productCategory);
        hasNonEventProducts = true;
      }
    }

    if (foundEvent) {
      return {
        hasEventProducts: true,
        hasNonEventProducts,
        event: foundEvent,
        eventDate: foundEvent.event_date,
        eventName: foundEvent.name,
        deliveryEnabled: foundEvent.delivery_enabled,
        pickupEnabled: foundEvent.pickup_enabled,
        eventTimeSlots: foundEvent.time_slots || [],
        eventProductIds: getEventProductIds(foundEvent.id),
        freeDessertsEnabled: foundEvent.free_desserts_enabled || false,
      };
    }

    return {
      ...defaultInfo,
      hasNonEventProducts,
    };
  }, [items, activeEvents, eventProducts, isEventProduct, getEventProductIds]);

  return cartEventInfo;
};

// Helper function to filter categories based on cart event state
export const filterCategoriesForEventExclusivity = (
  categories: any[],
  cartEventInfo: CartEventInfo,
  eventProductIds: string[]
): any[] => {
  const { hasEventProducts, hasNonEventProducts } = cartEventInfo;

  return categories.map(category => {
    let filteredItems = [...category.items];

    if (hasEventProducts) {
      // When event products are in cart: only show desserts, boissons, and the event products themselves
      if (isAllowedCategoryWithEvent(category.id)) {
        // Keep all desserts and boissons
        return { ...category, items: filteredItems };
      }
      // For other categories, only keep event products
      filteredItems = filteredItems.filter(item => eventProductIds.includes(item.id));
    } else if (hasNonEventProducts) {
      // When non-event products are in cart: hide event products
      filteredItems = filteredItems.filter(item => !eventProductIds.includes(item.id));
    }
    // If cart is empty or only has desserts/boissons: show everything

    return { ...category, items: filteredItems };
  }).filter(category => category.items.length > 0); // Remove empty categories
};
