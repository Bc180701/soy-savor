
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';

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
    
    // Vérifier les variables d'environnement requises
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeKey) {
      console.error('❌ Variable STRIPE_SECRET_KEY manquante');
      return new Response(
        JSON.stringify({ error: 'Configuration Stripe manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables Supabase manquantes');
      return new Response(
        JSON.stringify({ error: 'Configuration Supabase manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Variables d\'environnement vérifiées');

    // Récupérer et valider les données de commande
    let orderData: OrderData;
    try {
      orderData = await req.json();
      console.log('📦 Données de commande reçues:', {
        itemsCount: orderData.items?.length,
        total: orderData.total,
        restaurantId: orderData.restaurantId,
        orderType: orderData.orderType
      });
    } catch (jsonError) {
      console.error('❌ Erreur parsing JSON:', jsonError);
      return new Response(
        JSON.stringify({ error: 'Données de commande invalides' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation des données obligatoires
    if (!orderData.items || orderData.items.length === 0) {
      console.error('❌ Aucun article dans la commande');
      return new Response(
        JSON.stringify({ error: 'Aucun article dans la commande' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer les éléments de ligne pour Stripe Checkout
    const lineItems = orderData.items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.menuItem.name,
          description: item.specialInstructions || undefined,
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

    console.log('💰 Création session Stripe...', {
      lineItemsCount: lineItems.length,
      totalAmount: orderData.total
    });
    
    // Déterminer le restaurant ID
    const targetRestaurantId = orderData.restaurantId || "11111111-1111-1111-1111-111111111111";
    console.log('🏪 Restaurant cible:', targetRestaurantId);

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
    
    // Créer la session Stripe Checkout via API REST
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': orderData.successUrl,
        'cancel_url': orderData.cancelUrl,
        'customer_email': orderData.clientEmail || '',
        ...lineItems.reduce((acc, item, index) => {
          acc[`line_items[${index}][price_data][currency]`] = item.price_data.currency;
          acc[`line_items[${index}][price_data][product_data][name]`] = item.price_data.product_data.name;
          if (item.price_data.product_data.description) {
            acc[`line_items[${index}][price_data][product_data][description]`] = item.price_data.product_data.description;
          }
          acc[`line_items[${index}][price_data][unit_amount]`] = item.price_data.unit_amount.toString();
          acc[`line_items[${index}][quantity]`] = item.quantity.toString();
          return acc;
        }, {} as Record<string, string>),
        'payment_method_types[0]': 'card',
        'metadata[user_id]': userId || 'guest',
        'metadata[restaurant_id]': targetRestaurantId,
        'metadata[order_type]': orderData.orderType,
        'metadata[scheduled_for]': orderData.scheduledFor,
        'metadata[customer_notes]': orderData.customerNotes || '',
        'metadata[delivery_address]': orderData.orderType === 'delivery' ? 
          `${orderData.deliveryStreet}, ${orderData.deliveryPostalCode} ${orderData.deliveryCity}` : '',
        'metadata[tip_amount]': orderData.tip ? orderData.tip.toString() : '0',
        'metadata[discount_amount]': orderData.discount ? orderData.discount.toString() : '0',
        'metadata[promo_code]': orderData.promoCode || '',
      })
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ Erreur Stripe API:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la création de la session de paiement',
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = await stripeResponse.json();
    console.log('✅ Session Stripe créée:', session.id);

    // Initialiser Supabase avec la clé de service
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Client Supabase admin créé');

    // Créer la commande dans la base de données
    console.log('💾 Création de la commande en base...');
    
    try {
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
        throw new Error(`Erreur création commande: ${orderError.message}`);
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
      
    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError);
      // Ne pas bloquer si erreur DB, la session Stripe est créée
      console.log('⚠️ Continuons avec la session Stripe malgré l\'erreur DB');
    }
      
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('❌ Erreur globale dans create-checkout:', err);
    
    // Retourner une erreur détaillée
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    const errorStack = err instanceof Error ? err.stack : 'Aucune stack trace';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
