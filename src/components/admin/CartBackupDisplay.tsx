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

      // Calculer la date limite (24h avant la commande)
      const orderDate = new Date(order.createdAt);
      const minDate = new Date(orderDate.getTime() - 24 * 60 * 60 * 1000);

      // Requête Supabase sécurisée (évite le bug PGRST116)
      const { data, error } = await supabase
        .from("cart_backup")
        .select("id, cart_items, created_at, session_id, is_used, restaurant_id")
        .eq("session_id", order.clientEmail || "anonymous")
        .gte("created_at", minDate.toISOString())
        .lte("created_at", orderDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(1); // <-- on force un seul résultat

      if (error) {
        console.error("Erreur Supabase cart_backup:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la sauvegarde du panier.",
          variant: "destructive",
        });
        return;
      }

      const backup = data?.[0];
      if (backup && Array.isArray(backup.cart_items)) {
        setCartBackup({
          id: backup.id,
          cart_items: backup.cart_items as unknown as CartBackupItem[],
          created_at: backup.created_at,
          session_id: backup.session_id,
          is_used: backup.is_used,
        });
      }
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue pendant la récupération du panier.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const recoverCartItems = async () => {
    if (!cartBackup) return;
    try {
      setRecovering(true);

      const { data, error } = await supabase.functions.invoke("recover-order-items", {
        body: { orderId: order.id },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur inconnue");

      toast({
        title: "Items récupérés avec succès",
        description: `${data.itemsProcessed || 0} articles ont été restaurés.`,
      });

      // Marquer le backup comme utilisé
      const { error: updateError } = await supabase
        .from("cart_backup")
        .update({ is_used: true })
        .eq("id", cartBackup.id);

      if (updateError) {
        console.warn("Erreur lors du marquage du backup comme utilisé:", updateError);
      }

      onItemsRecovered?.();
    } catch (err) {
      console.error("Erreur recoverCartItems:", err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les articles de la commande.",
        variant: "destructive",
      });
    } finally {
      setRecovering(false);
    }
  };

  // Ne rien afficher si la commande a déjà des items
  if (order.items && order.items.length > 0) return null;

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

  if (!cartBackup) return null;

  const totalItems = cartBackup.cart_items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = cartBackup.cart_items.reduce(
    (sum, i) => sum + i.menuItem.price * i.quantity,
    0
  );

  return (
    <Card className="border-green-200 bg-green-50 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-green-800 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Articles sauvegardés trouvés
        </CardTitle>
        <p className="text-sm text-green-700">
          Sauvegarde créée le{" "}
          {new Date(cartBackup.created_at).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-green-800">Articles :</span>{" "}
            {totalItems} produits
          </div>
          <div>
            <span className="font-medium text-green-800">Total :</span>{" "}
            {totalAmount.toFixed(2)}€
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {cartBackup.cart_items.map((item, i) => (
            <div
              key={i}
              className="bg-white p-3 rounded border border-green-200 flex justify-between"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                {item.menuItem.description && (
                  <div className="text-xs text-gray-600 mt-1">
                    {item.menuItem.description}
                  </div>
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
          ))}
        </div>

        <Button
          onClick={recoverCartItems}
          disabled={recovering}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
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

        <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
          💡 Ces articles ont été sauvegardés automatiquement lors du passage au paiement.
          Cliquez sur "Récupérer" pour les associer à cette commande.
        </div>
      </CardContent>
    </Card>
  );
};
