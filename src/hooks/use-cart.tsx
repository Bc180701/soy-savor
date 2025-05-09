import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem } from '@/types';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CartStore {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => void;
  removeItem: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  initiateSumUpPayment: (orderId: string, customerEmail: string) => Promise<{ success: boolean; redirectUrl?: string; error?: string }>;
  total: number;
  itemCount: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      
      addItem: (menuItem, quantity, specialInstructions) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.menuItem.id === menuItem.id
          );

          let updatedItems;
          
          if (existingItemIndex !== -1) {
            // L'item existe déjà, on met à jour la quantité
            updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            
            if (specialInstructions) {
              updatedItems[existingItemIndex].specialInstructions = specialInstructions;
            }
          } else {
            // Nouvel item
            updatedItems = [
              ...state.items,
              { menuItem, quantity, specialInstructions },
            ];
          }
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      removeItem: (id) => {
        set((state) => {
          const updatedItems = state.items.filter((item) => item.menuItem.id !== id);
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      incrementQuantity: (id) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      decrementQuantity: (id) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === id && item.quantity > 1
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === id ? { ...item, quantity } : item
          );
          
          const total = updatedItems.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
          );
          
          const itemCount = updatedItems.reduce(
            (count, item) => count + item.quantity, 
            0
          );
          
          return { items: updatedItems, total, itemCount };
        });
      },
      
      updateInstructions: (id, instructions) => {
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.menuItem.id === id ? { ...item, specialInstructions: instructions } : item
          );
          return { items: updatedItems };
        });
      },
      
      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },
      
      initiateSumUpPayment: async (orderId, customerEmail) => {
        try {
          const { items, total } = get();
          
          // Use the application's origin URL for the return URL
          const returnUrl = window.location.origin;
          
          console.log("Initiating SumUp payment with OAuth2:", { orderId, customerEmail, total, returnUrl });
          
          // Call the Edge Function with proper error handling
          const { data, error } = await supabase.functions.invoke('create-sumup-checkout', {
            body: {
              orderData: {
                orderId,
                items,
                total,
                customerEmail,
                returnUrl
              }
            }
          });
          
          console.log("SumUp payment response:", data, error);
          
          if (error) {
            console.error('Error from Edge Function:', error);
            toast({
              variant: "destructive",
              title: "Erreur de paiement",
              description: "Impossible de contacter le service de paiement. Veuillez réessayer."
            });
            
            return { 
              success: false, 
              error: error.message || 'Échec de l\'initialisation du paiement' 
            };
          }
          
          if (!data || !data.success || !data.redirectUrl) {
            console.error('SumUp payment initialization failed:', data);
            
            // Handle detailed error response
            const errorMessage = data?.error || 'Erreur de communication avec SumUp';
            const statusCode = data?.statusCode;
            
            let description = "Impossible de contacter le service de paiement. Veuillez réessayer.";
            
            if (statusCode === 401) {
              description = "Problème d'authentification avec le service de paiement.";
            } else if (statusCode === 400) {
              description = "Les données de la commande sont incorrectes.";
            } else if (data?.error) {
              description = data.error;
            }
            
            toast({
              variant: "destructive",
              title: "Erreur de paiement",
              description: description
            });
            
            return { 
              success: false, 
              error: errorMessage
            };
          }
          
          console.log("SumUp redirect URL:", data.redirectUrl);
          
          toast({
            variant: "success",
            title: "Paiement initialisé",
            description: "Vous allez être redirigé vers la page de paiement."
          });
          
          // Don't clear cart yet - we'll do that after successful payment confirmation
      
          return { 
            success: true, 
            redirectUrl: data.redirectUrl 
          };
        } catch (err) {
          console.error('Error in initiateSumUpPayment:', err);
          
          toast({
            variant: "destructive",
            title: "Erreur de paiement",
            description: "Une erreur inattendue s'est produite. Veuillez réessayer."
          });
          
          return { 
            success: false, 
            error: err instanceof Error ? err.message : 'Une erreur est survenue' 
          };
        }
      },
    }),
    {
      name: 'sushieats-cart',
      skipHydration: true,
    }
  )
);
