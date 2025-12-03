import { useMemo } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useSpecialEvents, SpecialEvent, EventTimeSlot } from '@/hooks/useSpecialEvents';

interface CartEventInfo {
  hasEventProducts: boolean;
  event: SpecialEvent | null;
  eventDate: string | null;
  eventName: string | null;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  eventTimeSlots: EventTimeSlot[];
  eventProductIds: string[];
}

export const useCartEventProducts = (restaurantId?: string): CartEventInfo => {
  const { items } = useCart();
  const { activeEvents, eventProducts, isEventProduct, getEventProductIds } = useSpecialEvents(restaurantId);

  const cartEventInfo = useMemo(() => {
    // Default values
    const defaultInfo: CartEventInfo = {
      hasEventProducts: false,
      event: null,
      eventDate: null,
      eventName: null,
      deliveryEnabled: true,
      pickupEnabled: true,
      eventTimeSlots: [],
      eventProductIds: [],
    };

    if (!items.length || !activeEvents.length) {
      return defaultInfo;
    }

    // Check each cart item to see if it's linked to an event
    for (const item of items) {
      // CartItem structure has menuItem.id for the product ID
      const productId = item.menuItem?.id;
      const productName = item.menuItem?.name || 'Produit';
      
      if (!productId) continue;
      
      const event = isEventProduct(productId);
      if (event) {
        console.log('🎄 Event product found in cart:', productName, 'Event:', event.name);
        
        return {
          hasEventProducts: true,
          event,
          eventDate: event.event_date,
          eventName: event.name,
          deliveryEnabled: event.delivery_enabled,
          pickupEnabled: event.pickup_enabled,
          eventTimeSlots: event.time_slots || [],
          eventProductIds: getEventProductIds(event.id),
        };
      }
    }

    return defaultInfo;
  }, [items, activeEvents, eventProducts, isEventProduct, getEventProductIds]);

  return cartEventInfo;
};
