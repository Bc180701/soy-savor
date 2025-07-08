import { CartItem, Order } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export type OrderResponse = {
  orders: Order[];
  error: Error | null;
};

export const createOrder = async (
  orderInput: {
    items: CartItem[];
    subtotal: number;
    tax: number;
    deliveryFee: number;
    tip?: number;
    total: number;
    discount?: number;
    promoCode?: string;
    orderType: "delivery" | "pickup" | "dine-in";
    paymentMethod: "credit-card" | "cash" | "paypal";
    deliveryInstructions?: string;
    scheduledFor: Date;
    customerNotes?: string;
    pickupTime?: string;
    allergies?: string[];
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    deliveryStreet?: string;
    deliveryCity?: string;
    deliveryPostalCode?: string;
  },
  restaurantId?: string
): Promise<{ success: boolean; order?: Order; error?: any }> => {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Utiliser le restaurant fourni ou le restaurant par défaut (Châteaurenard)
    const targetRestaurantId = restaurantId || "11111111-1111-1111-1111-111111111111";

    console.log(`🏪 Création de commande pour le restaurant: ${targetRestaurantId}`);

    // Création de la commande dans la base de données
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId, // null si pas connecté
        restaurant_id: targetRestaurantId, // IMPORTANT: bien associer le restaurant
        subtotal: orderInput.subtotal,
        tax: orderInput.tax,
        delivery_fee: orderInput.deliveryFee,
        tip: orderInput.tip || 0,
        total: orderInput.total,
        discount: orderInput.discount || 0,
        promo_code: orderInput.promoCode,
        order_type: orderInput.orderType,
        status: "pending",
        payment_method: orderInput.paymentMethod,
        payment_status: "pending",
        delivery_instructions: orderInput.deliveryInstructions,
        scheduled_for: orderInput.scheduledFor.toISOString(),
        customer_notes: orderInput.customerNotes,
        pickup_time: orderInput.pickupTime,
        allergies: orderInput.allergies,
        client_name: orderInput.clientName,
        client_phone: orderInput.clientPhone,
        client_email: orderInput.clientEmail,
        delivery_street: orderInput.deliveryStreet,
        delivery_city: orderInput.deliveryCity,
        delivery_postal_code: orderInput.deliveryPostalCode,
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Erreur lors de la création de la commande:", orderError);
      return { success: false, error: orderError };
    }

    console.log(`✅ Commande créée avec succès: ${newOrder.id} pour le restaurant ${targetRestaurantId}`);

    // Ajouter les articles de la commande
    const orderItemPromises = orderInput.items.map((item) => {
      return supabase
        .from("order_items")
        .insert({
          order_id: newOrder.id,
          product_id: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          special_instructions: item.specialInstructions,
        });
    });

    await Promise.all(orderItemPromises);

    // Transform the response to match the Order type
    const orderResult: Order = {
      id: newOrder.id,
      userId: newOrder.user_id,
      items: orderInput.items,
      subtotal: newOrder.subtotal,
      tax: newOrder.tax,
      deliveryFee: newOrder.delivery_fee,
      tip: newOrder.tip,
      total: newOrder.total,
      discount: newOrder.discount,
      promoCode: newOrder.promo_code,
      orderType: newOrder.order_type as "delivery" | "pickup" | "dine-in",
      status: newOrder.status as "pending" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "completed" | "cancelled",
      paymentMethod: newOrder.payment_method as "credit-card",
      paymentStatus: newOrder.payment_status as "pending" | "paid" | "failed",
      deliveryInstructions: newOrder.delivery_instructions,
      scheduledFor: new Date(newOrder.scheduled_for),
      createdAt: new Date(newOrder.created_at),
      customerNotes: newOrder.customer_notes,
      pickupTime: newOrder.pickup_time,
      clientName: newOrder.client_name,
      clientPhone: newOrder.client_phone,
      clientEmail: newOrder.client_email,
      deliveryStreet: newOrder.delivery_street,
      deliveryCity: newOrder.delivery_city,
      deliveryPostalCode: newOrder.delivery_postal_code
    };

    return {
      success: true,
      order: orderResult
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création de la commande:", error);
    return { success: false, error };
  }
};

export const getOrdersByUser = async (): Promise<OrderResponse> => {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { orders: [], error: new Error("Utilisateur non connecté") };
    }

    // Récupérer les commandes de l'utilisateur
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("payment_status", "paid") // Uniquement les commandes payées
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Erreur lors de la récupération des commandes:", ordersError);
      return { orders: [], error: new Error(ordersError.message) };
    }

    // Convert database orders to Order type
    const orders: Order[] = (ordersData || []).map(order => ({
      id: order.id,
      userId: order.user_id,
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.delivery_fee,
      tip: order.tip || undefined,
      total: order.total,
      discount: order.discount || undefined,
      promoCode: order.promo_code || undefined,
      orderType: order.order_type as "delivery" | "pickup" | "dine-in",
      status: order.status as "pending" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "completed" | "cancelled",
      paymentMethod: "credit-card",
      paymentStatus: order.payment_status as "pending" | "paid" | "failed",
      deliveryInstructions: order.delivery_instructions || undefined,
      scheduledFor: new Date(order.scheduled_for),
      createdAt: new Date(order.created_at),
      customerNotes: order.customer_notes || undefined,
      pickupTime: order.pickup_time || undefined,
      contactPreference: order.contact_preference || undefined,
      allergies: order.allergies || undefined,
      clientName: order.client_name || undefined,
      clientPhone: order.client_phone || undefined,
      clientEmail: order.client_email || undefined,
      deliveryStreet: order.delivery_street || undefined,
      deliveryCity: order.delivery_city || undefined,
      deliveryPostalCode: order.delivery_postal_code || undefined,
      items: [] // We'll fetch items separately if needed
    }));

    return {
      orders,
      error: null
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des commandes:", error);
    return { orders: [], error: error instanceof Error ? error : new Error(String(error)) };
  }
};

export const getAllOrders = async (restaurantId?: string): Promise<OrderResponse> => {
  try {
    console.log("📋 Début de récupération de toutes les commandes pour le restaurant:", restaurantId);
    
    // Construire la requête avec ou sans filtre de restaurant
    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        restaurant_id,
        subtotal,
        tax,
        delivery_fee,
        tip,
        total,
        discount,
        promo_code,
        order_type,
        status,
        payment_method,
        payment_status,
        delivery_instructions,
        scheduled_for,
        created_at,
        customer_notes,
        pickup_time,
        contact_preference,
        allergies,
        client_name,
        client_phone,
        client_email,
        delivery_street,
        delivery_city,
        delivery_postal_code
      `)
      .order('created_at', { ascending: false });

    // Ajouter le filtre restaurant si fourni
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
      console.log("🏪 Filtrage par restaurant:", restaurantId);
    }
      
    const response = await query;
      
    if (response.error) {
      console.error("❌ Erreur lors de la récupération des commandes:", response.error);
      // Create a proper Error instance from the PostgrestError
      return { orders: [], error: new Error(response.error.message) };
    }
    
    console.log(`✅ ${response.data?.length || 0} commandes récupérées de Supabase pour le restaurant ${restaurantId || 'tous'}`);
    const orders = response.data || [];

    // Convertir les données Supabase au format de notre application
    const formattedOrders: Order[] = orders.map(order => ({
      id: order.id,
      userId: order.user_id,
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.delivery_fee,
      tip: order.tip || undefined,
      total: order.total,
      discount: order.discount || undefined,
      promoCode: order.promo_code || undefined,
      orderType: order.order_type as "delivery" | "pickup" | "dine-in",
      status: order.status as "pending" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "completed" | "cancelled",
      paymentMethod: "credit-card",
      paymentStatus: order.payment_status as "pending" | "paid" | "failed",
      deliveryInstructions: order.delivery_instructions || undefined,
      scheduledFor: new Date(order.scheduled_for),
      createdAt: new Date(order.created_at),
      customerNotes: order.customer_notes || undefined,
      pickupTime: order.pickup_time || undefined,
      contactPreference: order.contact_preference || undefined,
      allergies: order.allergies || undefined,
      clientName: order.client_name || undefined,
      clientPhone: order.client_phone || undefined,
      clientEmail: order.client_email || undefined,
      deliveryStreet: order.delivery_street || undefined,
      deliveryCity: order.delivery_city || undefined,
      deliveryPostalCode: order.delivery_postal_code || undefined,
      items: [] // Nous allons les récupérer séparément
    }));

    // Récupérer les articles de commande pour chaque commande
    for (const order of formattedOrders) {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          price,
          special_instructions,
          products(name)
        `)
        .eq('order_id', order.id);

      if (itemsError) {
        console.error(`Erreur lors de la récupération des articles pour la commande ${order.id}:`, itemsError);
        continue;
      }

      // Mettre en forme les articles de commande
      if (items && items.length > 0) {
        console.log(`${items.length} articles trouvés pour la commande ${order.id}`);
        order.items = items.map(item => ({
          menuItem: {
            id: item.product_id,
            name: item.products?.name || `Produit ${item.product_id.slice(0, 6)}...`,
            price: item.price,
            category: "plateaux" // Catégorie par défaut
          },
          quantity: item.quantity,
          specialInstructions: item.special_instructions
        }));
      } else {
        console.log(`Aucun article trouvé pour la commande ${order.id}`);
      }
    }

    console.log(`${formattedOrders.length} commandes formatées avec succès`);
    return { orders: formattedOrders, error: null };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des commandes:", error);
    return { 
      orders: [], 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Récupérer les informations de la commande pour les notifications
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error("Erreur lors de la récupération des informations de commande:", fetchError);
      return { success: false, error: fetchError.message };
    }

    // Mise à jour du statut
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut de la commande:", error);
      return { success: false, error: error.message };
    }

    // Envoyer notification au client
    const clientEmail = order.client_email;
    const clientPhone = order.client_phone;
    
    if (clientEmail) {
      await sendStatusUpdateEmail(clientEmail, order.client_name || "Client", status, orderId);
    }
    
    if (clientPhone) {
      // À implémenter si vous souhaitez envoyer des SMS
      // await sendStatusUpdateSMS(clientPhone, status, orderId);
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour du statut de la commande:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite lors de la mise à jour du statut de la commande." 
    };
  }
};

// Fonction pour envoyer une notification par email
const sendStatusUpdateEmail = async (email: string, name: string, status: string, orderId: string): Promise<void> => {
  try {
    const statusMessages: Record<string, string> = {
      'pending': 'est en attente de confirmation',
      'confirmed': 'a été confirmée',
      'preparing': 'est en cours de préparation',
      'ready': 'est prête à être retirée ou livrée',
      'out-for-delivery': 'est en cours de livraison',
      'delivered': 'a été livrée',
      'completed': 'est terminée',
      'cancelled': 'a été annulée'
    };
    
    const statusMessage = statusMessages[status] || `a changé de statut (${status})`;
    
    const { error } = await supabase.functions.invoke('send-order-notification', {
      body: {
        email,
        name,
        orderId,
        status,
        statusMessage
      }
    });
    
    if (error) {
      console.error("Erreur lors de l'envoi de l'email de notification:", error);
      throw error;
    }
    
    console.log(`Notification email envoyé à ${email} pour la commande ${orderId}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de notification:", error);
  }
};
