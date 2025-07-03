
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

// Utiliser l'import direct de Stripe sans les dépendances problématiques
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno&no-check';

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
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('🚀 Début de create-checkout');
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('❌ Clé Stripe manquante');
      return new Response(
        JSON.stringify({ error: 'La clé API Stripe n\'est pas configurée.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const orderData: OrderData = await req.json();
    console.log('📦 Données de commande reçues:', {
      itemsCount: orderData.items?.length,
      total: orderData.total,
      restaurantId: orderData.restaurantId,
      orderType: orderData.orderType
    });
    
    // Initialiser Supabase avec la clé de service pour contourner les RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authentification de l'utilisateur (optionnelle)
    let userId: string | undefined;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabaseClient.auth.getUser(token);
        userId = userData.user?.id;
        console.log('👤 Utilisateur authentifié:', userId);
      } catch (authError) {
        console.log("👤 Utilisateur non authentifié, commande en tant qu'invité");
      }
    }
    
    // Déterminer le restaurant ID - utiliser celui fourni ou le défaut (Châteaurenard)
    const targetRestaurantId = orderData.restaurantId || "11111111-1111-1111-1111-111111111111";
    console.log('🏪 Restaurant cible:', targetRestaurantId);
    
    // Créer ou récupérer le client Stripe
    let customerId: string | undefined;
    if (orderData.clientEmail) {
      const { data: customers } = await stripe.customers.list({
        email: orderData.clientEmail,
        limit: 1,
      });
      
      if (customers && customers.length > 0) {
        customerId = customers[0].id;
        console.log('💳 Client Stripe existant:', customerId);
      } else {
        const newCustomer = await stripe.customers.create({
          email: orderData.clientEmail,
          name: orderData.clientName,
          phone: orderData.clientPhone,
        });
        customerId = newCustomer.id;
        console.log('💳 Nouveau client Stripe créé:', customerId);
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
        unit_amount: Math.round(item.menuItem.price * 100),
      },
      quantity: item.quantity,
    }));

    // Ajouter les frais
    if (orderData.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Frais de livraison' },
          unit_amount: Math.round(orderData.deliveryFee * 100),
        },
        quantity: 1,
      });
    }
    
    if (orderData.tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'TVA (10%)' },
          unit_amount: Math.round(orderData.tax * 100),
        },
        quantity: 1,
      });
    }
    
    if (orderData.tip && orderData.tip > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Pourboire' },
          unit_amount: Math.round(orderData.tip * 100),
        },
        quantity: 1,
      });
    }

    console.log('💰 Création session Stripe...');
    
    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: !customerId ? orderData.clientEmail : undefined,
      payment_method_types: ['card'],
      line_items: lineItems,
      discounts: orderData.discount && orderData.discount > 0 ? [
        {
          coupon: await createOrRetrieveCoupon(stripe, orderData.discount, orderData.promoCode),
        },
      ] : undefined,
      mode: 'payment',
      success_url: orderData.successUrl,
      cancel_url: orderData.cancelUrl,
      metadata: {
        user_id: userId || 'guest',
        restaurant_id: targetRestaurantId,
        order_type: orderData.orderType,
        scheduled_for: orderData.scheduledFor,
        customer_notes: orderData.customerNotes || '',
        delivery_address: orderData.orderType === 'delivery' ? 
          `${orderData.deliveryStreet}, ${orderData.deliveryPostalCode} ${orderData.deliveryCity}` : '',
        tip_amount: orderData.tip ? orderData.tip.toString() : '0',
        discount_amount: orderData.discount ? orderData.discount.toString() : '0',
        promo_code: orderData.promoCode || '',
      },
    });

    console.log('✅ Session Stripe créée:', session.id);

    // Créer la commande dans la base de données AVANT la redirection
    console.log('💾 Création de la commande en base...');
    
    const { data: orderRecord, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        restaurant_id: targetRestaurantId,
        subtotal: Number(orderData.subtotal),
        tax: Number(orderData.tax),
        delivery_fee: Number(orderData.deliveryFee),
        tip: orderData.tip ? Number(orderData.tip) : 0,
        discount: orderData.discount ? Number(orderData.discount) : 0,
        promo_code: orderData.promoCode || null,
        total: Number(orderData.total),
        order_type: orderData.orderType,
        status: 'pending',
        payment_method: 'credit-card',
        payment_status: 'pending',
        scheduled_for: orderData.scheduledFor,
        client_name: orderData.clientName || null,
        client_email: orderData.clientEmail || null,
        client_phone: orderData.clientPhone || null,
        delivery_street: orderData.deliveryStreet || null,
        delivery_city: orderData.deliveryCity || null,
        delivery_postal_code: orderData.deliveryPostalCode || null,
        customer_notes: orderData.customerNotes || null,
        stripe_session_id: session.id
      })
      .select('id')
      .single();

    if (orderError) {
      console.error("❌ Erreur création commande:", orderError);
      throw new Error(`Erreur lors de la création de la commande: ${orderError.message}`);
    }

    console.log('✅ Commande créée avec ID:', orderRecord.id);

    // Ajouter les articles de la commande
    for (const item of orderData.items) {
      const { error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert({
          order_id: orderRecord.id,
          product_id: item.menuItem.id,
          quantity: item.quantity,
          price: Number(item.menuItem.price),
          special_instructions: item.specialInstructions || null
        });
        
      if (itemError) {
        console.error('❌ Erreur ajout article:', itemError);
      }
    }

    console.log('✅ Articles de commande ajoutés');
    console.log('🎯 Commande créée pour le restaurant:', targetRestaurantId);
    
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('❌ Erreur dans create-checkout:', err);
    
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Une erreur inconnue est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createOrRetrieveCoupon(stripe: Stripe, discountAmount: number, promoCode?: string): Promise<string> {
  const couponId = `discount_${discountAmount.toString().replace('.', '_')}`;
  
  try {
    const existingCoupon = await stripe.coupons.retrieve(couponId);
    return existingCoupon.id;
  } catch (error) {
    const newCoupon = await stripe.coupons.create({
      id: couponId,
      amount_off: Math.round(discountAmount * 100),
      currency: 'eur',
      name: promoCode ? `Réduction (${promoCode})` : 'Réduction',
    });
    return newCoupon.id;
  }
}
