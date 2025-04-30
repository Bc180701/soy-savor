import { CartItem, Order } from "@/types";
import { supabase } from "@/integrations/supabase/client";

export type OrderResponse = {
  orders: Order[];
  error: Error | null;
};

export const placeOrder = async (
  orderData: {
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
    deliveryAddress?: {
      street: string;
      city: string;
      postalCode: string;
      additionalInfo?: string;
    };
    deliveryInstructions?: string;
    scheduledFor: Date;
    customerNotes?: string;
    pickupTime?: string;
    allergies?: string[];
    clientName: string;
    clientPhone: string;
    clientEmail: string;
  }
): Promise<{ order: Order | null; error: Error | null }> => {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Création de la commande dans la base de données
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId, // null si pas connecté
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        delivery_fee: orderData.deliveryFee,
        tip: orderData.tip || 0,
        total: orderData.total,
        discount: orderData.discount || 0,
        promo_code: orderData.promoCode,
        order_type: orderData.orderType,
        status: "pending",
        payment_method: orderData.paymentMethod,
        payment_status: "pending",
        delivery_instructions: orderData.deliveryInstructions,
        scheduled_for: orderData.scheduledFor,
        customer_notes: orderData.customerNotes,
        pickup_time: orderData.pickupTime,
        allergies: orderData.allergies,
        client_name: orderData.clientName,
        client_phone: orderData.clientPhone,
        client_email: orderData.clientEmail,
        delivery_street: orderData.deliveryAddress?.street,
        delivery_city: orderData.deliveryAddress?.city,
        delivery_postal_code: orderData.deliveryAddress?.postalCode,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Erreur lors de la création de la commande:", orderError);
      return { order: null, error: orderError };
    }

    // Ajouter les articles de la commande
    const orderItemPromises = orderData.items.map((item) => {
      return supabase
        .from("order_items")
        .insert({
          order_id: orderData.id,
          product_id: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          special_instructions: item.specialInstructions,
        });
    });

    await Promise.all(orderItemPromises);

    return {
      order: orderData as Order,
      error: null,
    };
  } catch (error) {
    console.error("Erreur lors de la création de la commande:", error);
    return { order: null, error: error as Error };
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
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Erreur lors de la récupération des commandes:", ordersError);
      return { orders: [], error: ordersError };
    }

    return {
      orders: ordersData as Order[],
      error: null,
    };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des commandes:", error);
    return { orders: [], error: error as Error };
  }
};

export const getAllOrders = async (): Promise<OrderResponse> => {
  try {
    // Use explicit error handling for the database query
    const response = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
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
      
    if (response.error) {
      console.error("Erreur lors de la récupération des commandes:", response.error);
      return { orders: [], error: response.error.message };
    }
    
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
      paymentMethod: "credit-card", // Modifié: toujours carte bancaire
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
    }

    return { orders: formattedOrders };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des commandes:", error);
    return { orders: [], error: "Une erreur inattendue s'est produite lors de la récupération des commandes." };
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut de la commande:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur inattendue lors de la mise à jour du statut de la commande:", error);
    return { success: false, error: "Une erreur inattendue s'est produite lors de la mise à jour du statut de la commande." };
  }
};
