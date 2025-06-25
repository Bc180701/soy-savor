
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateDeliveryFee } from "@/services/deliveryService";

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

    // Utiliser le restaurant par défaut
    const defaultRestaurantId = "11111111-1111-1111-1111-111111111111";

    // Récupérer des produits réels de la base de données pour ce restaurant
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('restaurant_id', defaultRestaurantId)
      .limit(3);

    if (productsError || !products || products.length === 0) {
      console.error("Erreur lors de la récupération des produits:", productsError);
      return { success: false, error: "Impossible de récupérer les produits pour la simulation." };
    }

    // Créer des articles simulés à partir des produits réels
    const simulatedItems: SimulatedOrderItem[] = products.map((product, index) => ({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: index === 0 ? 2 : 1 // Premier produit avec quantité 2, les autres avec quantité 1
    }));

    // Calculer les totaux
    const subtotal = simulatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% de TVA
    
    // Randomly choose delivery or pickup
    const orderType = Math.random() > 0.5 ? "delivery" : "pickup";
    
    // Calculate delivery fee based on subtotal
    const deliveryFee = orderType === "delivery" ? calculateDeliveryFee(subtotal) : 0;
    
    const total = subtotal + tax + deliveryFee;

    // Ajouter 30 minutes à l'heure actuelle pour la livraison prévue
    const scheduledFor = new Date(Date.now() + 30 * 60 * 1000);

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        restaurant_id: defaultRestaurantId,
        subtotal,
        tax,
        delivery_fee: deliveryFee,
        total,
        order_type: orderType,
        payment_method: "credit-card",
        payment_status: "paid",
        status: "confirmed",
        scheduled_for: scheduledFor.toISOString(),
        delivery_instructions: orderType === "delivery" ? "Sonner à l'interphone et appeler si absence" : null
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

    // Utiliser le toast de Sonner avec la bonne syntaxe
    toast.success(`Commande simulée #${order.id.substring(0, 8)} créée avec succès`);

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Erreur inattendue lors de la simulation de commande:", error);
    return { success: false, error: "Une erreur inattendue s'est produite lors de la simulation de commande." };
  }
};
