
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.20.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  menuItem: {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
  };
  quantity: number;
  specialInstructions?: string;
}

interface OrderData {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip?: number;
  discount?: number;
  promoCode?: string;
  total: number;
  orderType: "delivery" | "pickup";
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  customerNotes?: string;
  scheduledFor: string;
  restaurantId?: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('=== DÉBUT CREATE CHECKOUT ===');
    
    // Vérifier la clé Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('Clé Stripe manquante');
      return new Response(
        JSON.stringify({ error: 'La clé API Stripe n\'est pas configurée.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Récupérer les données de la commande depuis le corps de la requête
    const orderData: OrderData = await req.json();
    console.log('Données de commande reçues:', {
      itemsCount: orderData.items?.length,
      total: orderData.total,
      orderType: orderData.orderType,
      restaurantId: orderData.restaurantId
    });
    
    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Client pour authentification utilisateur (si disponible)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Client avec rôle de service pour les opérations de base de données (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authentification de l'utilisateur (optionnelle)
    let userId: string | undefined;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabase.auth.getUser(token);
        userId = userData.user?.id;
        console.log('Utilisateur authentifié:', userId);
      } catch (authError) {
        console.log("Utilisateur non authentifié, commande en tant qu'invité");
      }
    }
    
    // Créer ou récupérer le client Stripe
    let customerId: string | undefined;
    
    if (orderData.clientEmail) {
      const { data: customers } = await stripe.customers.list({
        email: orderData.clientEmail,
        limit: 1,
      });
      
      if (customers && customers.length > 0) {
        customerId = customers[0].id;
        console.log('Client Stripe existant trouvé:', customerId);
      } else {
        // Créer un nouveau client
        const newCustomer = await stripe.customers.create({
          email: orderData.clientEmail,
          name: orderData.clientName,
          phone: orderData.clientPhone,
        });
        customerId = newCustomer.id;
        console.log('Nouveau client Stripe créé:', customerId);
      }
    }

    // Créer les éléments de ligne pour Stripe Checkout
    const lineItems = orderData.items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.menuItem.name,
          description: item.specialInstructions,
        },
        unit_amount: Math.round(item.menuItem.price * 100), // Montant en centimes
      },
      quantity: item.quantity,
    }));

    // Ajouter les frais de livraison si nécessaires
    if (orderData.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: Math.round(orderData.deliveryFee * 100),
        },
        quantity: 1,
      });
    }
    
    // Ajouter la TVA
    if (orderData.tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'TVA (10%)',
          },
          unit_amount: Math.round(orderData.tax * 100),
        },
        quantity: 1,
      });
    }
    
    // Ajouter le pourboire si présent
    if (orderData.tip && orderData.tip > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Pourboire',
          },
          unit_amount: Math.round(orderData.tip * 100),
        },
        quantity: 1,
      });
    }
    
    // Appliquer la réduction comme un coupon si présent
    let discounts = undefined;
    if (orderData.discount && orderData.discount > 0) {
      try {
        const couponId = await createOrRetrieveCoupon(stripe, orderData.discount, orderData.promoCode);
        discounts = [{ coupon: couponId }];
        console.log('Coupon appliqué:', couponId);
      } catch (couponError) {
        console.error('Erreur lors de la création du coupon:', couponError);
      }
    }
    
    console.log('Création de la session Stripe...');
    
    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: !customerId ? orderData.clientEmail : undefined,
      payment_method_types: ['card'],
      line_items: lineItems,
      discounts: discounts,
      mode: 'payment',
      success_url: `${orderData.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: orderData.cancelUrl,
      metadata: {
        user_id: userId || 'guest',
        order_type: orderData.orderType,
        scheduled_for: orderData.scheduledFor,
        customer_notes: orderData.customerNotes || '',
        delivery_address: orderData.orderType === 'delivery' ? 
          `${orderData.deliveryStreet}, ${orderData.deliveryPostalCode} ${orderData.deliveryCity}` : '',
        tip_amount: orderData.tip ? (orderData.tip).toString() : '0',
        discount_amount: orderData.discount ? (orderData.discount).toString() : '0',
        promo_code: orderData.promoCode || '',
        restaurant_id: orderData.restaurantId || '11111111-1111-1111-1111-111111111111',
      },
    });

    console.log('Session Stripe créée:', session.id);

    // Utiliser le restaurant fourni ou le restaurant par défaut (Châteaurenard)
    const targetRestaurantId = orderData.restaurantId || "11111111-1111-1111-1111-111111111111";

    // Créer la commande avec un statut de paiement "pending"
    console.log('Création de la commande dans la base de données...');
    const { data: orderRecord, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId, // null si invité
        restaurant_id: targetRestaurantId,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        delivery_fee: orderData.deliveryFee,
        tip: orderData.tip || 0,
        discount: orderData.discount || 0,
        promo_code: orderData.promoCode || null,
        total: orderData.total,
        order_type: orderData.orderType,
        status: 'pending',
        payment_method: 'credit-card',
        payment_status: 'pending',
        scheduled_for: orderData.scheduledFor,
        client_name: orderData.clientName,
        client_email: orderData.clientEmail,
        client_phone: orderData.clientPhone,
        delivery_street: orderData.deliveryStreet,
        delivery_city: orderData.deliveryCity,
        delivery_postal_code: orderData.deliveryPostalCode,
        customer_notes: orderData.customerNotes,
        stripe_session_id: session.id
      })
      .select('id')
      .single();

    if (orderError) {
      console.error("Erreur lors de la création de la commande:", orderError);
      throw new Error(`Erreur de création de commande: ${orderError.message}`);
    }

    console.log('Commande créée avec ID:', orderRecord.id);

    // Ajouter les articles de la commande
    console.log('Ajout des articles de commande...');
    for (const item of orderData.items) {
      const { error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert({
          order_id: orderRecord.id,
          product_id: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          special_instructions: item.specialInstructions
        });
      
      if (itemError) {
        console.error('Erreur lors de l\'ajout d\'un article:', itemError);
      }
    }
    
    console.log('=== FIN CREATE CHECKOUT SUCCÈS ===');
    
    // Renvoyer l'URL de la session
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    // Gérer les erreurs
    console.error('=== ERREUR CREATE CHECKOUT ===', err);
    
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Une erreur inconnue est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fonction pour créer ou récupérer un coupon Stripe
async function createOrRetrieveCoupon(stripe: Stripe, discountAmount: number, promoCode?: string): Promise<string> {
  const couponId = `discount_${discountAmount.toString().replace('.', '_')}`;
  
  try {
    // Essayer d'abord de récupérer le coupon existant
    const existingCoupon = await stripe.coupons.retrieve(couponId);
    return existingCoupon.id;
  } catch (error) {
    // Si le coupon n'existe pas, le créer
    const newCoupon = await stripe.coupons.create({
      id: couponId,
      amount_off: Math.round(discountAmount * 100), // Montant en centimes
      currency: 'eur',
      name: promoCode ? `Réduction (${promoCode})` : 'Réduction',
    });
    return newCoupon.id;
  }
}
