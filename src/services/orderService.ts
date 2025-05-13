
import { CartItem, Order } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Type for order creation response
export type OrderCreationResponse = {
  order?: Order;
  error?: Error;
  orderId?: string;
  clientSecret?: string;
};

// Type for general order responses
export type OrderResponse = {
  orders?: Order[];
  order?: Order;
  error: Error | null;
};

// Type for update status response
export type UpdateStatusResponse = {
  success: boolean;
  error: string | null;
};

// Type for delivery fee response
export type DeliveryFeeResponse = {
  fee: number;
  error: Error | null;
};

export const getDeliveryFee = async (postalCode: string): Promise<DeliveryFeeResponse> => {
  try {
    // Récupérer les frais de livraison depuis Supabase
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('delivery_fee')
      .ilike('postal_codes', `%${postalCode}%`)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération des frais de livraison:", error);
      
      // Vérifier si l'erreur indique qu'aucun résultat n'a été trouvé
      if (error.code === 'PGRST116') {
        return { 
          fee: 0, 
          error: new Error("Ce code postal n'est pas dans notre zone de livraison")
        };
      }
      
      return { fee: 0, error: new Error(error.message) };
    }

    return { fee: data?.delivery_fee || 0, error: null };
  } catch (error) {
    console.error("Exception lors de la récupération des frais de livraison:", error);
    return { fee: 0, error: error as Error };
  }
};

export const createOrder = async (
  items: CartItem[],
  subtotal: number,
  total: number,
  orderType: "delivery" | "pickup" | "dine-in",
  scheduledFor: Date,
  customerName?: string,
  customerEmail?: string,
  customerPhone?: string,
  deliveryAddress?: string,
  deliveryCity?: string,
  deliveryPostalCode?: string,
  deliveryInstructions?: string,
  customerNotes?: string,
  promoCode?: string,
  taxAmount?: number,
  deliveryFee?: number,
  tipAmount?: number,
  userId?: string
): Promise<OrderCreationResponse> => {
  try {
    // Récupérer l'ID utilisateur si connecté
    const { data: { user } } = await supabase.auth.getUser();
    const authenticatedUserId = user?.id;

    // Préparer les données de la commande pour Supabase
    const orderData = {
      user_id: userId || authenticatedUserId || null,
      status: "pending",
      payment_status: "pending",
      total,
      subtotal,
      tax: taxAmount || 0,
      delivery_fee: deliveryFee || 0,
      tip: tipAmount || 0,
      promo_code: promoCode || null,
      order_type: orderType,
      scheduled_for: scheduledFor.toISOString(),
      customer_name: customerName || null,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      delivery_address: deliveryAddress || null,
      delivery_city: deliveryCity || null,
      delivery_postal_code: deliveryPostalCode || null,
      delivery_instructions: deliveryInstructions || null,
      customer_notes: customerNotes || null,
      payment_method: "credit-card"
    };

    // Insérer la commande dans Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Erreur lors de la création de la commande:", orderError);
      return { error: new Error(orderError.message) };
    }

    // Obtenir l'ID de la commande créée
    const orderId = order.id;

    // Préparer les articles de la commande
    const orderItems = items.map(item => ({
      order_id: orderId,
      product_id: item.menuItem.id,
      quantity: item.quantity,
      price: item.menuItem.price,
      special_instructions: item.specialInstructions || null
    }));

    // Insérer les articles de la commande
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Erreur lors de l'ajout des articles à la commande:", itemsError);
      return { error: new Error(itemsError.message) };
    }

    // Créer une session de paiement avec Stripe
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderId,
        amount: Math.round(total * 100), // Convertir en centimes pour Stripe
        customerEmail: customerEmail || user?.email
      })
    });

    const stripeData = await response.json();
    
    if (!response.ok) {
      console.error("Erreur lors de la création de la session Stripe:", stripeData);
      return { 
        error: new Error("Erreur lors de la préparation du paiement"),
        orderId 
      };
    }

    return {
      orderId,
      clientSecret: stripeData.clientSecret
    };
  } catch (error) {
    console.error("Exception lors de la création de la commande:", error);
    return { error: error as Error };
  }
};

export const getAllOrders = async (): Promise<OrderResponse> => {
  try {
    console.log("Début de récupération de toutes les commandes");
    
    // Requête à Supabase pour récupérer toutes les commandes
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        payment_status,
        total,
        subtotal,
        tax,
        delivery_fee,
        tip,
        promo_code,
        order_type,
        scheduled_for,
        created_at,
        updated_at,
        customer_name,
        customer_email,
        customer_phone,
        customer_notes,
        delivery_instructions,
        order_items (
          id,
          product_id,
          quantity,
          price,
          special_instructions,
          products (
            id,
            name,
            price,
            category
          )
        ),
        delivery_address,
        delivery_city,
        delivery_postal_code
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erreur Supabase lors de la récupération des commandes:", error);
      return { orders: [], error: new Error(error.message) };
    }
    
    console.log(`${data?.length || 0} commandes récupérées de Supabase`);
    const orders = data || [];

    // Convertir les données Supabase au format de notre application
    const formattedOrders: Order[] = orders.map(order => {
      // Extraire les articles de la commande
      const items = order.order_items || [];

      // Formater les infos de base de la commande
      const formattedOrder: Order = {
        id: order.id,
        userId: order.user_id || undefined,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax || 0,
        deliveryFee: order.delivery_fee || 0,
        tipAmount: order.tip || 0,
        promoCode: order.promo_code || undefined,
        orderType: order.order_type as "delivery" | "pickup" | "dine-in",
        status: order.status as "pending" | "confirmed" | "preparing" | "ready" | "out-for-delivery" | "delivered" | "completed" | "cancelled",
        paymentMethod: "credit-card",
        paymentStatus: order.payment_status as "pending" | "paid" | "failed",
        deliveryInstructions: order.delivery_instructions || undefined,
        scheduledFor: new Date(order.scheduled_for),
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
        customerName: order.customer_name || undefined,
        customerEmail: order.customer_email || undefined,
        customerPhone: order.customer_phone || undefined,
        customerNotes: order.customer_notes || undefined,
        deliveryAddress: order.delivery_address || undefined,
        deliveryCity: order.delivery_city || undefined,
        deliveryPostalCode: order.delivery_postal_code || undefined,
        items: []
      };

      // Remplacer les valeurs null par undefined pour compatibilité avec l'interface Order
      for (const [key, value] of Object.entries(formattedOrder)) {
        if (value === null) {
          (formattedOrder as any)[key] = undefined;
        }
      }

      // Mettre en forme les articles de commande
      if (items && items.length > 0) {
        console.log(`${items.length} articles trouvés pour la commande ${order.id}`);
        formattedOrder.items = items.map(item => ({
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

      return formattedOrder;
    });

    console.log(`${formattedOrders.length} commandes formatées avec succès`);
    return { orders: formattedOrders, error: null };
  } catch (error) {
    console.error("Erreur inattendue lors de la récupération des commandes:", error);
    return { orders: [], error: error as Error };
  }
};

export const getOrderById = async (orderId: string): Promise<OrderResponse> => {
  try {
    // Récupérer une commande spécifique depuis Supabase
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        payment_status,
        total,
        subtotal,
        tax,
        delivery_fee,
        tip,
        promo_code,
        order_type,
        scheduled_for,
        created_at,
        updated_at,
        customer_name,
        customer_email,
        customer_phone,
        customer_notes,
        delivery_instructions,
        order_items (
          id,
          product_id,
          quantity,
          price,
          special_instructions,
          products (
            id,
            name,
            price,
            category
          )
        ),
        delivery_address,
        delivery_city,
        delivery_postal_code
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération de la commande:", error);
      return { error: new Error(error.message) };
    }

    // Formatter la commande
    const order = data;
    const items = order.order_items || [];

    const formattedOrder: Order = {
      id: order.id,
      userId: order.user_id || undefined,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax || 0,
      deliveryFee: order.delivery_fee || 0,
      tipAmount: order.tip || 0,
      promoCode: order.promo_code || undefined,
      orderType: order.order_type,
      status: order.status,
      paymentMethod: "credit-card",
      paymentStatus: order.payment_status,
      deliveryInstructions: order.delivery_instructions || undefined,
      scheduledFor: new Date(order.scheduled_for),
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      customerName: order.customer_name || undefined,
      customerEmail: order.customer_email || undefined,
      customerPhone: order.customer_phone || undefined,
      customerNotes: order.customer_notes || undefined,
      deliveryAddress: order.delivery_address || undefined,
      deliveryCity: order.delivery_city || undefined,
      deliveryPostalCode: order.delivery_postal_code || undefined,
      items: items.map(item => ({
        menuItem: {
          id: item.product_id,
          name: item.products?.name || `Produit ${item.product_id.slice(0, 6)}...`,
          price: item.price,
          category: "plateaux"
        },
        quantity: item.quantity,
        specialInstructions: item.special_instructions
      }))
    };

    return { order: formattedOrder, error: null };
  } catch (error) {
    console.error("Exception lors de la récupération de la commande:", error);
    return { error: error as Error };
  }
};

// Fonction pour récupérer les commandes d'un utilisateur
export const getOrdersByUser = async (): Promise<OrderResponse> => {
  try {
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { orders: [], error: new Error("Utilisateur non connecté") };
    }
    
    // Récupérer ses commandes
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        payment_status,
        total,
        subtotal,
        tax,
        delivery_fee,
        tip,
        promo_code,
        order_type,
        scheduled_for,
        created_at,
        customer_name,
        customer_email,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        order_items (
          id,
          product_id,
          quantity,
          price,
          special_instructions,
          products (
            id,
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des commandes de l'utilisateur:", error);
      return { orders: [], error: new Error(error.message) };
    }
    
    // Convertir les données
    const formattedOrders: Order[] = (data || []).map(order => ({
      id: order.id,
      userId: order.user_id,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax || 0,
      deliveryFee: order.delivery_fee || 0,
      tipAmount: order.tip || 0,
      promoCode: order.promo_code || undefined,
      orderType: order.order_type as "delivery" | "pickup" | "dine-in",
      status: order.status as any,
      paymentMethod: "credit-card",
      paymentStatus: order.payment_status as any,
      scheduledFor: new Date(order.scheduled_for),
      createdAt: new Date(order.created_at),
      customerName: order.customer_name || undefined,
      customerEmail: order.customer_email || undefined,
      deliveryAddress: order.delivery_address || undefined,
      deliveryCity: order.delivery_city || undefined,
      deliveryPostalCode: order.delivery_postal_code || undefined,
      items: (order.order_items || []).map(item => ({
        menuItem: {
          id: item.product_id,
          name: item.products?.name || 'Produit',
          price: item.price,
          category: "plateaux"
        },
        quantity: item.quantity,
        specialInstructions: item.special_instructions
      }))
    }));
    
    return { orders: formattedOrders, error: null };
  } catch (error) {
    console.error("Exception lors de la récupération des commandes de l'utilisateur:", error);
    return { orders: [], error: error as Error };
  }
};

// Fonction pour mettre à jour le statut d'une commande
export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<UpdateStatusResponse> => {
  try {
    console.log(`Mise à jour du statut de la commande ${orderId} à ${newStatus}`);
    
    // D'abord, obtenir les informations sur la commande pour la notification
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, 
        customer_email, 
        customer_name,
        order_items (
          id,
          quantity,
          products (
            name
          )
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      console.error("Erreur lors de la récupération des infos de commande:", orderError);
      return { success: false, error: orderError.message };
    }
    
    // Mettre à jour le statut
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      return { success: false, error: error.message };
    }

    // Envoyer une notification au client si un email est disponible
    if (orderData?.customer_email) {
      try {
        // Préparer les informations des articles pour le message
        const orderItems = orderData.order_items
          ? orderData.order_items.map(item => 
              `${item.quantity}x ${item.products?.name || 'Produit'}`)
          : [];
          
        // Envoyer la notification
        const notificationPayload = {
          orderId,
          customerEmail: orderData.customer_email,
          customerName: orderData.customer_name || '',
          newStatus,
          orderItems
        };
        
        console.log("Envoi de notification:", notificationPayload);
        
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/order-notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(notificationPayload)
        });
        
        console.log("Notification envoyée avec succès");
      } catch (notifError) {
        // Ne pas bloquer la mise à jour en cas d'erreur de notification
        console.error("Erreur lors de l'envoi de la notification:", notifError);
      }
    } else {
      console.log("Pas d'email client pour la notification");
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Exception lors de la mise à jour du statut:", error);
    return { success: false, error: error.message };
  }
};

export const simulatePayment = async (orderId: string): Promise<{ success: boolean, error: string | null }> => {
  try {
    // Met à jour le statut de paiement dans Supabase
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', orderId);

    if (error) {
      console.error("Erreur lors de la simulation du paiement:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Exception lors de la simulation du paiement:", error);
    return { success: false, error: error.message };
  }
};
