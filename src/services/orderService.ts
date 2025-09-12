import { CartItem, Order } from "@/types";
import { supabase, getOrderItems } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { sendOrderStatusSMS } from "./smsService";

interface TimeSlotVerificationResult {
  available: boolean;
  message: string;
  currentCount?: number;
  maxAllowed?: number;
}

export type OrderResponse = {
  orders: Order[];
  error: Error | null;
};

// Fonction de vérification côté serveur des créneaux
const verifyTimeSlot = async (
  restaurantId: string,
  orderType: string,
  scheduledFor: string
): Promise<TimeSlotVerificationResult> => {
  try {
    console.log("🔍 Vérification serveur du créneau:", { restaurantId, orderType, scheduledFor });
    
    const { data, error } = await supabase.functions.invoke('verify-time-slot', {
      body: { restaurantId, orderType, scheduledFor }
    });

    if (error) {
      console.error("❌ Erreur lors de la vérification du créneau:", error);
      return { available: false, message: "Erreur de vérification du créneau" };
    }

    console.log("✅ Résultat vérification serveur:", data);
    return data;
  } catch (error) {
    console.error("❌ Erreur réseau lors de la vérification:", error);
    return { available: false, message: "Erreur de connexion" };
  }
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

    // 🚨 VÉRIFICATION CRITIQUE DU CRÉNEAU CÔTÉ SERVEUR POUR LES LIVRAISONS ET RETRAITS
    if (orderInput.orderType === 'delivery' || orderInput.orderType === 'pickup') {
      console.log(`🔒 Vérification finale du créneau de ${orderInput.orderType}...`);
      const verification = await verifyTimeSlot(
        targetRestaurantId,
        orderInput.orderType,
        orderInput.scheduledFor.toISOString()
      );

      if (!verification.available) {
        console.log("🚫 CRÉNEAU BLOQUÉ - Commande refusée");
        const serviceType = orderInput.orderType === 'delivery' ? 'livraison' : 'retrait';
        return { 
          success: false, 
          error: `Créneau de ${serviceType} non disponible: ${verification.message}` 
        };
      }
      console.log("✅ Créneau vérifié et disponible, création de la commande...");
    }

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

    const itemResults = await Promise.all(orderItemPromises);
    
    // Vérifier si tous les articles ont été correctement insérés
    const itemErrors = itemResults.filter(result => result.error);
    if (itemErrors.length > 0) {
      console.error("❌ Erreurs lors de l'insertion des articles:", itemErrors);
      // Optionnel: supprimer la commande si les articles n'ont pas pu être créés
      await supabase.from("orders").delete().eq("id", newOrder.id);
      return { success: false, error: `Erreur lors de l'insertion des articles: ${itemErrors.map(e => e.error.message).join(', ')}` };
    }

    console.log(`✅ ${orderInput.items.length} articles ajoutés à la commande ${newOrder.id}`);

    // Transform the response to match the Order type
    const orderResult: Order = {
      id: newOrder.id,
      userId: newOrder.user_id,
      restaurant_id: newOrder.restaurant_id, // IMPORTANT: inclure le restaurant_id
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
    console.log("📋 [getAllOrders] Début de récupération pour le restaurant:", restaurantId);
    console.log("📋 [getAllOrders] Type de restaurantId:", typeof restaurantId, "Valeur:", restaurantId);
    
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
        delivery_postal_code,
        items_summary
      `)
      .order('created_at', { ascending: false });

    // Ajouter le filtre restaurant si fourni avec LOGS DÉTAILLÉS
    if (restaurantId) {
      console.log("🏪 [getAllOrders] FILTRAGE STRICT pour restaurant:", restaurantId);
      query = query.eq('restaurant_id', restaurantId);
    } else {
      console.log("🌍 [getAllOrders] AUCUN FILTRE - récupération de TOUTES les commandes");
    }
      
    const response = await query;
      
    if (response.error) {
      console.error("❌ Erreur lors de la récupération des commandes:", response.error);
      return { orders: [], error: new Error(response.error.message) };
    }
    
    const orders = response.data || [];
    console.log(`✅ ${orders.length} commandes récupérées de Supabase pour le restaurant ${restaurantId || 'tous'}`);
    
    // VALIDATION SERVEUR: vérifier l'attribution des commandes
    if (restaurantId && orders.length > 0) {
      const badOrders = orders.filter(order => order.restaurant_id !== restaurantId);
      if (badOrders.length > 0) {
        console.error("🚨 [SERVEUR] COMMANDES MAL ATTRIBUÉES détectées:", {
          restaurant_attendu: restaurantId,
          commandes_incorrectes: badOrders.map(o => ({
            id: o.id,
            restaurant_recu: o.restaurant_id,
            client: o.client_name
          }))
        });
      }
    }
    
    // LOG détaillé de la répartition des restaurants
    if (orders.length > 0) {
      const restaurantStats = orders.reduce((acc, order) => {
        acc[order.restaurant_id] = (acc[order.restaurant_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log("📊 [getAllOrders] Répartition des commandes par restaurant:", restaurantStats);
    }

    // Convertir les données Supabase au format de notre application
    const formattedOrders: Order[] = orders.map(order => ({
      id: order.id,
      userId: order.user_id,
      restaurant_id: order.restaurant_id, // IMPORTANT: inclure le restaurant_id
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

    // Récupérer les articles de commande pour chaque commande avec la logique unifiée
    for (const order of formattedOrders) {
      // Get items_summary from raw order data to pass to unified function
      const rawOrder = orders.find(o => o.id === order.id);
      const processedItems = await getOrderItems(order.id, rawOrder?.items_summary);
      
      if (processedItems && processedItems.length > 0) {
        console.log(`${processedItems.length} articles trouvés pour la commande ${order.id}`);
        order.items = processedItems.map(item => ({
          menuItem: {
            id: item.id,
            name: item.name,
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
    console.log(`📱 Mise à jour du statut de la commande ${orderId} vers ${status}`);
    
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

    console.log(`📋 Informations commande récupérées:`, {
      id: order.id,
      type: order.order_type,
      phone: order.client_phone,
      email: order.client_email,
      name: order.client_name,
      restaurantId: order.restaurant_id
    });

    // Mise à jour du statut
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error("Erreur lors de la mise à jour du statut de la commande:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Statut de la commande ${orderId} mis à jour vers ${status}`);

    // Envoyer notifications au client
    const clientEmail = order.client_email;
    const clientPhone = order.client_phone;
    const clientName = order.client_name;
    
    // Notification par email
    if (clientEmail) {
      console.log(`📧 Envoi notification email à ${clientEmail}...`);
      await sendStatusUpdateEmail(clientEmail, clientName || "Client", status, orderId);
    }
    
    // Notification par SMS pour les statuts critiques
    if (clientPhone && shouldSendSMS(status, order.order_type)) {
      console.log(`📱 Envoi notification SMS à ${clientPhone} pour statut ${status}...`);
      try {
        const smsResult = await sendOrderStatusSMS({
          phoneNumber: clientPhone,
          orderId,
          orderType: order.order_type as 'delivery' | 'pickup' | 'dine-in',
          status,
          customerName: clientName || "Client",
          restaurantId: order.restaurant_id // Passer l'ID du restaurant
        });
        
        if (!smsResult.success) {
          console.error("❌ Échec envoi SMS:", smsResult.error);
        } else {
          console.log("✅ SMS envoyé avec succès pour la commande", orderId);
        }
      } catch (smsError) {
        console.error("❌ Erreur lors de l'envoi du SMS:", smsError);
        // Ne pas faire échouer la mise à jour du statut même si le SMS échoue
      }
    } else {
      console.log(`📱 SMS non envoyé - Phone: ${!!clientPhone}, shouldSend: ${shouldSendSMS(status, order.order_type)}`);
    }

    // Notification SMS au livreur du restaurant quand la commande part en livraison
    if (status === 'out-for-delivery' && order.order_type === 'delivery') {
      console.log(`🚚 Tentative d'envoi SMS au livreur pour la commande ${orderId}...`);
      try {
        // Récupérer le numéro du livreur du restaurant
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('delivery_phone, name')
          .eq('id', order.restaurant_id)
          .single();

        if (restaurantError) {
          console.error("❌ Erreur lors de la récupération du restaurant:", restaurantError);
        } else if (restaurant?.delivery_phone) {
          console.log(`📱 Envoi SMS au livreur ${restaurant.delivery_phone} du restaurant ${restaurant.name}...`);
          
          // Préparer le message pour le livreur
          const deliveryMessage = `🚚 NOUVELLE LIVRAISON! Commande #${orderId.slice(0, 8)} prête pour livraison. Client: ${clientName || 'N/A'}, Tél: ${clientPhone || 'N/A'}, Adresse: ${order.delivery_street || ''} ${order.delivery_city || ''} ${order.delivery_postal_code || ''}. Restaurant: ${restaurant.name}`;
          
          // Utiliser directement l'edge function pour le livreur
          const { error: smsError } = await supabase.functions.invoke('send-sms-notification', {
            body: {
              phoneNumber: restaurant.delivery_phone,
              message: deliveryMessage,
              orderId: orderId
            }
          });

          if (smsError) {
            console.error("❌ Erreur lors de l'envoi du SMS au livreur:", smsError);
          } else {
            console.log(`✅ SMS envoyé avec succès au livreur pour la commande ${orderId}`);
          }
        } else {
          console.log(`📱 Aucun numéro de livreur configuré pour le restaurant ${order.restaurant_id}`);
        }
      } catch (deliveryError) {
        console.error("❌ Erreur lors de l'envoi du SMS au livreur:", deliveryError);
        // Ne pas faire échouer la mise à jour du statut même si le SMS au livreur échoue
      }
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

// Fonction pour déterminer si un SMS doit être envoyé selon le statut
const shouldSendSMS = (status: string, orderType: string): boolean => {
  console.log(`📋 Vérification envoi SMS - Status: ${status}, OrderType: ${orderType}`);
  
  // Envoyer SMS uniquement pour les transitions importantes
  switch (status) {
    case 'out-for-delivery':
      const shouldSendDelivery = orderType === 'delivery';
      console.log(`📱 SMS livraison: ${shouldSendDelivery}`);
      return shouldSendDelivery;
    case 'ready':
      const shouldSendReady = orderType === 'pickup';
      console.log(`📱 SMS prêt: ${shouldSendReady}`);
      return shouldSendReady;
    default:
      console.log(`📱 SMS non applicable pour le statut: ${status}`);
      return false;
  }
};

// Fonction pour envoyer une notification par email
const sendStatusUpdateEmail = async (email: string, name: string, status: string, orderId: string): Promise<void> => {
  try {
    console.log(`📧 Envoi notification email pour commande ${orderId} - Statut: ${status}`);
    
    // Correspondance des statuts avec ceux de l'edge function
    const statusMapping: Record<string, string> = {
      'confirmed': 'confirmée',
      'preparing': 'en_preparation',
      'ready': 'prête',
      'out-for-delivery': 'en_livraison',
      'delivered': 'livrée',
      'completed': 'récupérée'
    };
    
    const mappedStatus = statusMapping[status] || status;
    
    const { data, error } = await supabase.functions.invoke('change-statut-notif', {
      body: {
        email,
        name,
        orderId,
        status: mappedStatus
      }
    });
    
    if (error) {
      console.error("❌ Erreur lors de l'envoi de l'email de notification:", error);
      throw error;
    }
    
    console.log(`✅ Notification email envoyée à ${email} pour la commande ${orderId} - Status: ${mappedStatus}`);
  } catch (error) {
    console.error("💥 Erreur lors de l'envoi de l'email de notification:", error);
    // Ne pas faire échouer la mise à jour du statut même si l'email échoue
  }
};
