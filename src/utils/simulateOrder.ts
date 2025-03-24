
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SimulatedOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export const simulateOrder = async (): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    // Récupérer la session de l'utilisateur actuel
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "Vous devez être connecté pour simuler une commande." };
    }

    // Créer des produits simulés pour la commande
    const simulatedItems: SimulatedOrderItem[] = [
      {
        productId: crypto.randomUUID(),
        name: "Plateau Sushi Mix",
        price: 24.99,
        quantity: 1
      },
      {
        productId: crypto.randomUUID(),
        name: "California Roll",
        price: 8.50,
        quantity: 2
      },
      {
        productId: crypto.randomUUID(), 
        name: "Miso Soup",
        price: 3.99,
        quantity: 1
      }
    ];

    // Calculer les totaux
    const subtotal = simulatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% de TVA
    const deliveryFee = 2.99;
    const total = subtotal + tax + deliveryFee;

    // Ajouter 30 minutes à l'heure actuelle pour la livraison prévue
    const scheduledFor = new Date(Date.now() + 30 * 60 * 1000);

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        subtotal,
        tax,
        delivery_fee: deliveryFee,
        total,
        order_type: "delivery",
        payment_method: "credit-card",
        payment_status: "paid",
        status: "confirmed",
        scheduled_for: scheduledFor.toISOString(),
        delivery_instructions: "Sonner à l'interphone et appeler si absence"
      })
      .select('id')
      .single();

    if (orderError) {
      console.error("Erreur lors de la création de la commande simulée:", orderError);
      return { success: false, error: orderError.message };
    }

    // Ajouter les articles de la commande
    const orderItems = simulatedItems.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      special_instructions: ""
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Erreur lors de l'ajout des articles à la commande simulée:", itemsError);
      return { success: false, error: itemsError.message };
    }

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Erreur inattendue lors de la simulation de commande:", error);
    return { success: false, error: "Une erreur inattendue s'est produite lors de la simulation de commande." };
  }
};
