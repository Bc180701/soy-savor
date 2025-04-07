
import { supabase } from "@/integrations/supabase/client";
import { CartItem, Order } from "@/types";

export interface CreateOrderParams {
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
  deliveryAddressId?: string;
  deliveryInstructions?: string;
  scheduledFor: Date;
  customerNotes?: string;
  pickupTime?: string;
  contactPreference?: string;
  allergies?: string[];
  // Nouvelles informations de contact client
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
}

export const createOrder = async (params: CreateOrderParams): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    // Vérifier si l'utilisateur est connecté
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "Vous devez être connecté pour passer une commande." };
    }

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        subtotal: params.subtotal,
        tax: params.tax,
        delivery_fee: params.deliveryFee,
        tip: params.tip,
        total: params.total,
        discount: params.discount,
        promo_code: params.promoCode,
        order_type: params.orderType,
        payment_method: params.paymentMethod,
        delivery_address_id: params.deliveryAddressId,
        delivery_instructions: params.deliveryInstructions,
        scheduled_for: params.scheduledFor.toISOString(),
        customer_notes: params.customerNotes,
        pickup_time: params.pickupTime,
        contact_preference: params.contactPreference,
        allergies: params.allergies,
        // Ajout des nouveaux champs
        client_name: params.clientName,
        client_phone: params.clientPhone,
        client_email: params.clientEmail,
        delivery_street: params.deliveryStreet,
        delivery_city: params.deliveryCity,
        delivery_postal_code: params.deliveryPostalCode
      })
      .select('id')
      .single();

    if (orderError) {
      console.error("Erreur lors de la création de la commande:", orderError);
      return { success: false, error: orderError.message };
    }

    // Ajouter les articles de la commande
    const orderItems = params.items.map(item => ({
      order_id: order.id,
      product_id: item.menuItem.id,
      quantity: item.quantity,
      price: item.menuItem.price,
      special_instructions: item.specialInstructions,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Erreur lors de l'ajout des articles à la commande:", itemsError);
      return { success: false, error: itemsError.message };
    }

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error("Erreur inattendue lors de la création de la commande:", error);
    return { success: false, error: "Une erreur inattendue s'est produite lors de la création de la commande." };
  }
};

export const getOrdersByUser = async (): Promise<{ orders: Order[]; error?: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { orders: [], error: "Vous devez être connecté pour voir vos commandes." };
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
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
        allergies
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des commandes:", error);
      return { orders: [], error: error.message };
    }

    // Convertir les données Supabase au format de notre application
    const formattedOrders: Order[] = orders.map(order => ({
      id: order.id,
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.delivery_fee,
      tip: order.tip || undefined,
      total: order.total,
      discount: order.discount || undefined,
      promoCode: order.promo_code || undefined,
      orderType: order.order_type as "delivery" | "pickup" | "dine-in",
      status: order.status as "pending" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "completed" | "cancelled",
      paymentMethod: order.payment_method as "credit-card" | "cash" | "paypal",
      paymentStatus: order.payment_status as "pending" | "paid" | "failed",
      deliveryInstructions: order.delivery_instructions || undefined,
      scheduledFor: new Date(order.scheduled_for),
      createdAt: new Date(order.created_at),
      customerNotes: order.customer_notes || undefined,
      pickupTime: order.pickup_time || undefined,
      contactPreference: order.contact_preference || undefined,
      allergies: order.allergies || undefined,
      items: [] // Nous allons les récupérer séparément
    }));

    return { orders: formattedOrders };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des commandes:", error);
    return { orders: [], error: "Une erreur inattendue s'est produite lors de la récupération des commandes." };
  }
};

export const getAllOrders = async (): Promise<{ orders: Order[]; error?: string }> => {
  try {
    // Utiliser une vérification explicite des données retournées
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
      paymentMethod: order.payment_method as "credit-card" | "cash" | "paypal",
      paymentStatus: order.payment_status as "pending" | "paid" | "failed",
      deliveryInstructions: order.delivery_instructions || undefined,
      scheduledFor: new Date(order.scheduled_for),
      createdAt: new Date(order.created_at),
      customerNotes: order.customer_notes || undefined,
      pickupTime: order.pickup_time || undefined,
      contactPreference: order.contact_preference || undefined,
      allergies: order.allergies || undefined,
      // Ajout des nouveaux champs
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
          product_id,
          quantity,
          price,
          special_instructions
        `)
        .eq('order_id', order.id);

      if (itemsError) {
        console.error(`Erreur lors de la récupération des articles pour la commande ${order.id}:`, itemsError);
        continue;
      }

      // Simuler les articles de commande car nous n'avons pas accès aux détails complets des produits
      order.items = items.map(item => ({
        menuItem: {
          id: item.product_id,
          name: `Produit ${item.product_id.slice(0, 6)}...`, // Nom temporaire
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
