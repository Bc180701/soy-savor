import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { MenuItem } from '@/types';
import { useCart } from '@/hooks/use-cart';
import { supabase } from '@/integrations/supabase/client';

// Mapping des desserts gratuits par restaurant pour Saint Valentin
const EVENT_FREE_DESSERTS: Record<string, string> = {
  // St Martin
  '22222222-2222-2222-2222-222222222222': '2cd47428-e92a-4e29-95f5-0447e0827d15',
  // Châteaurenard  
  '11111111-1111-1111-1111-111111111111': '10507d1c-ca1c-4387-a1b7-c1994580c986',
};

interface EventFreeDessertPopupContextType {
  showFreeDessertPopup: boolean;
  freeDessertProduct: MenuItem | null;
  pendingEventProduct: MenuItem | null;
  triggerFreeDessertOffer: (eventProduct: MenuItem, restaurantId: string) => void;
  handleAcceptFreeDessert: () => MenuItem | null;
  handleDeclineFreeDessert: () => void;
  closePopup: () => void;
}

const EventFreeDessertPopupContext = createContext<EventFreeDessertPopupContextType | undefined>(undefined);

interface EventFreeDessertPopupProviderProps {
  children: ReactNode;
}

export const EventFreeDessertPopupProvider = ({ children }: EventFreeDessertPopupProviderProps) => {
  const [showFreeDessertPopup, setShowFreeDessertPopup] = useState(false);
  const [freeDessertProduct, setFreeDessertProduct] = useState<MenuItem | null>(null);
  const [pendingEventProduct, setPendingEventProduct] = useState<MenuItem | null>(null);
  const [pendingRestaurantId, setPendingRestaurantId] = useState<string | null>(null);

  // Charger le produit dessert quand on déclenche l'offre
  const loadFreeDessert = useCallback(async (restaurantId: string) => {
    const dessertId = EVENT_FREE_DESSERTS[restaurantId];
    if (!dessertId) {
      console.log('❌ Pas de dessert configuré pour ce restaurant:', restaurantId);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', dessertId)
        .single();

      if (error) throw error;

      if (data) {
        const dessertItem: MenuItem = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          price: 0, // Gratuit !
          imageUrl: data.image_url,
          category: 'desserts' as const,
          originalPrice: data.price,
        };
        return dessertItem;
      }
    } catch (error) {
      console.error('Erreur chargement dessert offert:', error);
    }
    return null;
  }, []);

  const triggerFreeDessertOffer = useCallback(async (eventProduct: MenuItem, restaurantId: string) => {
    console.log('🎁 Déclenchement offre dessert gratuit pour produit événement:', eventProduct.name);
    
    // Vérifier le ratio : nombre de desserts offerts déjà dans le panier vs nombre de plateaux événement
    const { items } = useCart.getState();
    const dessertId = EVENT_FREE_DESSERTS[restaurantId];
    
    // Compter les desserts offerts déjà dans le panier
    const freeDessertCount = items.reduce((count, item) => {
      if (item.specialInstructions?.includes('Dessert offert') || 
          item.specialInstructions?.includes('Saint Valentin')) {
        return count + item.quantity;
      }
      return count;
    }, 0);
    
    // Compter les plateaux événement dans le panier (y compris celui qu'on vient d'ajouter)
    // Note: le produit vient d'être ajouté au panier avant cet appel
    const eventProductCount = items.reduce((count, item) => {
      // On considère l'événement product comme celui qui a le même ID
      if (item.menuItem?.id === eventProduct.id) {
        return count + item.quantity;
      }
      return count;
    }, 0);
    
    console.log(`🎁 Ratio desserts/plateaux: ${freeDessertCount}/${eventProductCount}`);
    
    // Si on a déjà autant de desserts que de plateaux, ne pas proposer
    if (freeDessertCount >= eventProductCount) {
      console.log('🎁 Limite atteinte: pas de nouveau dessert offert');
      return;
    }
    
    // Charger le dessert correspondant au restaurant
    const dessert = await loadFreeDessert(restaurantId);
    
    if (dessert) {
      setPendingEventProduct(eventProduct);
      setPendingRestaurantId(restaurantId);
      setFreeDessertProduct(dessert);
      
      // Délai court avant d'afficher le popup
      setTimeout(() => {
        setShowFreeDessertPopup(true);
      }, 100);
    }
  }, [loadFreeDessert]);

  const handleAcceptFreeDessert = useCallback(() => {
    if (freeDessertProduct) {
      console.log('✅ Dessert gratuit accepté:', freeDessertProduct.name);
      setShowFreeDessertPopup(false);
      const dessert = freeDessertProduct;
      // Reset après un court délai
      setTimeout(() => {
        setFreeDessertProduct(null);
        setPendingEventProduct(null);
        setPendingRestaurantId(null);
      }, 100);
      return dessert;
    }
    return null;
  }, [freeDessertProduct]);

  const handleDeclineFreeDessert = useCallback(() => {
    console.log('❌ Dessert gratuit refusé');
    setShowFreeDessertPopup(false);
    setTimeout(() => {
      setFreeDessertProduct(null);
      setPendingEventProduct(null);
      setPendingRestaurantId(null);
    }, 100);
  }, []);

  const closePopup = useCallback(() => {
    setShowFreeDessertPopup(false);
  }, []);

  const value = {
    showFreeDessertPopup,
    freeDessertProduct,
    pendingEventProduct,
    triggerFreeDessertOffer,
    handleAcceptFreeDessert,
    handleDeclineFreeDessert,
    closePopup,
  };

  return (
    <EventFreeDessertPopupContext.Provider value={value}>
      {children}
    </EventFreeDessertPopupContext.Provider>
  );
};

export const useEventFreeDessertPopup = () => {
  const context = useContext(EventFreeDessertPopupContext);
  if (context === undefined) {
    throw new Error('useEventFreeDessertPopup must be used within an EventFreeDessertPopupProvider');
  }
  return context;
};
