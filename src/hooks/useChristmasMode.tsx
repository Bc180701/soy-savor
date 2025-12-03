import { useMemo } from 'react';
import { useSpecialEvents, SpecialEvent } from './useSpecialEvents';
import { MenuItem, MenuCategory } from '@/types';

interface UseChristmasModeReturn {
  isChristmasMode: boolean;
  isPreorderMode: boolean;
  christmasEvent: SpecialEvent | null;
  isChristmasProduct: (productId: string) => boolean;
  filterMenuForChristmas: (categories: MenuCategory[]) => MenuCategory[];
  getChristmasProductIds: () => string[];
  christmasEventDate: string | null;
}

export const useChristmasMode = (restaurantId?: string): UseChristmasModeReturn => {
  const {
    activeEvents,
    isEventDay,
    isPreorderPeriod,
    isEventProduct,
    getRestrictedMenuEvent,
    getAllowedCategories,
    getEventProductIds,
  } = useSpecialEvents(restaurantId);

  // Find Christmas-specific event (by slug or name)
  const christmasEvent = useMemo(() => {
    return activeEvents.find(e => 
      e.slug.includes('noel') || 
      e.name.toLowerCase().includes('noël') ||
      e.name.toLowerCase().includes('noel')
    ) || null;
  }, [activeEvents]);

  // Check if we're on Christmas day (event day)
  const isChristmasMode = useMemo(() => {
    if (!christmasEvent) return false;
    return isEventDay(christmasEvent);
  }, [christmasEvent, isEventDay]);

  // Check if we're in preorder period (before Christmas)
  const isPreorderMode = useMemo(() => {
    if (!christmasEvent) return false;
    return isPreorderPeriod(christmasEvent);
  }, [christmasEvent, isPreorderPeriod]);

  // Check if a product is a Christmas product
  const isChristmasProduct = (productId: string): boolean => {
    if (!christmasEvent) return false;
    const event = isEventProduct(productId);
    return event?.id === christmasEvent.id;
  };

  // Get all Christmas product IDs
  const getChristmasProductIds = (): string[] => {
    if (!christmasEvent) return [];
    return getEventProductIds(christmasEvent.id);
  };

  // Filter menu for Christmas day - show only Christmas products + allowed categories
  const filterMenuForChristmas = (categories: MenuCategory[]): MenuCategory[] => {
    if (!isChristmasMode || !christmasEvent) {
      return categories;
    }

    const restrictedEvent = getRestrictedMenuEvent();
    if (!restrictedEvent) {
      return categories;
    }

    const allowedCategoryIds = getAllowedCategories(restrictedEvent);
    const christmasProductIds = getChristmasProductIds();

    console.log('🎄 Filtering menu for Christmas:', {
      allowedCategories: allowedCategoryIds,
      christmasProducts: christmasProductIds
    });

    return categories
      .map(category => {
        // Check if this category is allowed
        const isCategoryAllowed = allowedCategoryIds.some(
          allowed => category.id.toLowerCase().includes(allowed.toLowerCase()) ||
                    category.name.toLowerCase().includes(allowed.toLowerCase())
        );

        if (isCategoryAllowed) {
          // Show all items in allowed categories (desserts, boissons, etc.)
          return category;
        }

        // For other categories, only show Christmas products
        const christmasItems = category.items.filter(item => 
          christmasProductIds.includes(item.id)
        );

        if (christmasItems.length === 0) {
          return null; // Hide category entirely
        }

        return {
          ...category,
          items: christmasItems
        };
      })
      .filter((cat): cat is MenuCategory => cat !== null);
  };

  return {
    isChristmasMode,
    isPreorderMode,
    christmasEvent,
    isChristmasProduct,
    filterMenuForChristmas,
    getChristmasProductIds,
    christmasEventDate: christmasEvent?.event_date || null,
  };
};
