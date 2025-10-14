import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";
import { Loader2, Package, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CartBackupDisplayProps {
  order: Order;
  onItemsRecovered?: () => void;
}

interface CartBackupItem {
  menuItem: {
    id: string;
    name: string;
    price: number;
    description?: string;
    category?: string;
    pieces?: number | null;
    restaurant_id: string;
  };
  quantity: number;
}

interface CartBackup {
  id: string;
  cart_items: CartBackupItem[];
  created_at: string;
  session_id: string;
  is_used: boolean;
}

export const CartBackupDisplay = ({ order, onItemsRecovered }: CartBackupDisplayProps) => {
  const [cartBackup, setCartBackup] = useState<CartBackup | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // N'afficher que si la commande n'a pas d'items
    if (order.items && order.items.length > 0) {
      setLoading(false);
      return;
    }
    
    fetchCartBackup();
  }, [order.id, order.clientEmail]);

  const fetchCartBackup = async () => {
    try {
      setLoading(true);
      
      // Chercher par email du client d'abord
      const { data, error } = await supabase
        .from('cart_backup')
        .select('id, cart_items, created_at, session_id, is_used, restaurant_id')
        .eq('session_id', order.clientEmail || 'anonymous')
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Erreur lors de la récupération du cart_backup:', error);
        return;
      }

      if (data && data.cart_items && Array.isArray(data.cart_items)) {
        setCartBackup({
          id: data.id,
          cart_items: data.cart_items as unknown as CartBackupItem[],
          created_at: data.created_at,
          session_id: data.session_id,
          is_used: data.is_used
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const recoverCartItems = async () => {
    if (!cartBackup) return;
    
    try {
      setRecovering(true);
      
      // Appeler la fonction edge pour récupérer les items
      const { data, error } = await supabase.functions.invoke('recover-order-items', {
        body: { orderId: order.id }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Items récupérés avec succès",
          description: `${data.itemsProcessed || 0} articles ont été récupérés pour cette commande.`,
        });
        
        // Marquer le backup comme utilisé
        await supabase
          .from('cart_backup')
          .update({ is_used: true })
          .eq('id', cartBackup.id);
        
        onItemsRecovered?.();
      } else {
        throw new Error(data?.error || 'Erreur lors de la récupération');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les articles de la commande.",
        variant: "destructive",
      });
    } finally {
      setRecovering(false);
    }
  };

  // Ne rien afficher si la commande a des items
  if (order.items && order.items.length > 0) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Recherche de sauvegarde...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cartBackup) {
    return null;
  }

  const totalItems = cartBackup.cart_items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartBackup.cart_items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  return (
    <Card className="border-green-200 bg-green-50 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-green-800 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Articles sauvegardés trouvés
        </CardTitle>
        <p className="text-sm text-green-700">
          Sauvegarde automatique du panier créée le {new Date(cartBackup.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-green-800">Articles: </span>
            <span>{totalItems} produits</span>
          </div>
          <div>
            <span className="font-medium text-green-800">Total: </span>
            <span>{totalAmount.toFixed(2)}€</span>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {cartBackup.cart_items.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded border border-green-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                    {item.menuItem.description && (
                      <div className="text-xs text-gray-600 mt-1">{item.menuItem.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {item.menuItem.category}
                      {item.menuItem.pieces && ` • ${item.menuItem.pieces} pièces`}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-medium">×{item.quantity}</div>
                    <div className="text-sm text-gray-600">
                      {item.menuItem.price.toFixed(2)}€
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={recoverCartItems}
            disabled={recovering}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {recovering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Récupération...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Récupérer ces articles
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
          💡 Ces articles ont été automatiquement sauvegardés lors du passage au paiement. 
          Cliquez sur "Récupérer" pour les associer à cette commande.
        </div>
      </CardContent>
    </Card>
  );
};