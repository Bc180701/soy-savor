import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EventTimeSlot {
  time: string; // e.g., "12:00"
  maxOrders?: number;
}

export interface SpecialEvent {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  preorder_start: string;
  preorder_end: string;
  restrict_menu_on_event: boolean;
  allowed_categories: string[] | null;
  is_active: boolean;
  restaurant_id: string | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  time_slots: EventTimeSlot[];
  image_url: string | null;
  banner_title: string | null;
  banner_description: string | null;
  free_desserts_enabled: boolean;
}

export interface EventProduct {
  id: string;
  event_id: string;
  product_id: string;
}

export const useSpecialEvents = (restaurantId?: string) => {
  const [activeEvents, setActiveEvents] = useState<SpecialEvent[]>([]);
  const [eventProducts, setEventProducts] = useState<EventProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveEvents = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch active events: global events (restaurant_id IS NULL) + restaurant-specific if restaurantId provided
        let eventsQuery = supabase
          .from('special_events')
          .select('*')
          .eq('is_active', true)
          .lte('preorder_start', today)
          .gte('event_date', today);

        if (restaurantId) {
          // Get global events OR events for this specific restaurant
          eventsQuery = eventsQuery.or(`restaurant_id.is.null,restaurant_id.eq.${restaurantId}`);
        } else {
          // Only global events if no restaurant specified
          eventsQuery = eventsQuery.is('restaurant_id', null);
        }

        const { data: events, error: eventsError } = await eventsQuery;

        if (eventsError) {
          console.error('Error fetching special events:', eventsError);
          return;
        }

        // Transform the data to match our interface
        const transformedEvents: SpecialEvent[] = (events || []).map(e => ({
          ...e,
          delivery_enabled: e.delivery_enabled ?? true,
          pickup_enabled: e.pickup_enabled ?? true,
          free_desserts_enabled: (e as any).free_desserts_enabled ?? false,
          // Transform time_slots: convert max_orders (snake_case) to maxOrders (camelCase)
          time_slots: Array.isArray(e.time_slots) 
            ? (e.time_slots as any[]).map((slot: any) => ({
                time: slot.time,
                maxOrders: slot.max_orders || slot.maxOrders // Support both formats
              }))
            : []
        }));

        console.log('🎄 Active special events:', transformedEvents);
        setActiveEvents(transformedEvents);

        // Fetch products for these events
        if (transformedEvents.length > 0) {
          const eventIds = transformedEvents.map(e => e.id);
          const { data: products, error: productsError } = await supabase
            .from('event_products')
            .select('*')
            .in('event_id', eventIds);

          if (productsError) {
            console.error('Error fetching event products:', productsError);
          } else {
            console.log('🎄 Event products:', products);
            setEventProducts(products || []);
          }
        }
      } catch (error) {
        console.error('Error in useSpecialEvents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveEvents();
  }, [restaurantId]);

  // Check if a product is linked to an active event
  const isEventProduct = (productId: string): SpecialEvent | null => {
    const eventProduct = eventProducts.find(ep => ep.product_id === productId);
    if (!eventProduct) return null;
    
    return activeEvents.find(e => e.id === eventProduct.event_id) || null;
  };

  // Check if we're on an event day (e.g., December 24th for Christmas)
  const isEventDay = (event?: SpecialEvent): boolean => {
    const today = new Date().toISOString().split('T')[0];
    if (event) {
      return event.event_date === today;
    }
    return activeEvents.some(e => e.event_date === today);
  };

  // Check if we're in preorder period (before event day)
  const isPreorderPeriod = (event?: SpecialEvent): boolean => {
    const today = new Date().toISOString().split('T')[0];
    if (event) {
      return today >= event.preorder_start && today <= event.preorder_end && today < event.event_date;
    }
    return activeEvents.some(e => 
      today >= e.preorder_start && today <= e.preorder_end && today < e.event_date
    );
  };

  // Get event that should restrict the menu today
  const getRestrictedMenuEvent = (): SpecialEvent | null => {
    const today = new Date().toISOString().split('T')[0];
    return activeEvents.find(e => 
      e.event_date === today && e.restrict_menu_on_event
    ) || null;
  };

  // Get allowed categories on event day
  const getAllowedCategories = (event: SpecialEvent): string[] => {
    return event.allowed_categories || [];
  };

  // Get all product IDs linked to a specific event
  const getEventProductIds = (eventId: string): string[] => {
    return eventProducts
      .filter(ep => ep.event_id === eventId)
      .map(ep => ep.product_id);
  };

  return {
    activeEvents,
    eventProducts,
    isLoading,
    isEventProduct,
    isEventDay,
    isPreorderPeriod,
    getRestrictedMenuEvent,
    getAllowedCategories,
    getEventProductIds,
  };
};
