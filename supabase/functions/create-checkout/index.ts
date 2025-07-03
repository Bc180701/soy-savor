
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
    console.log('🚀 [CREATE-CHECKOUT] Début de la fonction');
    
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      console.log('❌ [CREATE-CHECKOUT] Méthode non autorisée:', req.method);
      return new Response(
        JSON.stringify({ error: 'Méthode non autorisée' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer et parser le body
    let orderData: OrderData;
    try {
      const body = await req.text();
      console.log('📨 [CREATE-CHECKOUT] Body reçu:', body.substring(0, 200) + '...');
      orderData = JSON.parse(body);
      console.log('✅ [CREATE-CHECKOUT] Données parsées avec succès');
    } catch (parseError) {
      console.error('❌ [CREATE-CHECKOUT] Erreur parsing JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Données JSON invalides' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation des données
    console.log('🔍 [CREATE-CHECKOUT] Validation des données...');
    if (!orderData.items || orderData.items.length === 0) {
      console.log('❌ [CREATE-CHECKOUT] Aucun article dans la commande');
      return new Response(
        JSON.stringify({ error: 'Aucun article dans la commande' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orderData.clientEmail || !orderData.clientName) {
      console.log('❌ [CREATE-CHECKOUT] Informations client manquantes:', {
        email: !!orderData.clientEmail,
        name: !!orderData.clientName
      });
      return new Response(
        JSON.stringify({ error: 'Informations client manquantes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [CREATE-CHECKOUT] Validation des données réussie');

    // Vérifier la clé Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('❌ [CREATE-CHECKOUT] Clé Stripe manquante');
      return new Response(
        JSON.stringify({ error: 'Configuration Stripe manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ [CREATE-CHECKOUT] Clé Stripe trouvée');
    
    // Initialiser Stripe
    let stripe: Stripe;
    try {
      stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
      console.log('✅ [CREATE-CHECKOUT] Stripe initialisé');
    } catch (stripeError) {
      console.error('❌ [CREATE-CHECKOUT] Erreur initialisation Stripe:', stripeError);
      return new Response(
        JSON.stringify({ error: 'Erreur initialisation Stripe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialiser Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [CREATE-CHECKOUT] Configuration Supabase manquante');
      return new Response(
        JSON.stringify({ error: 'Configuration Supabase manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ [CREATE-CHECKOUT] Configuration Supabase OK');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authentification utilisateur (optionnelle)
    let userId: string | undefined;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabase.auth.getUser(token);
        userId = userData.user?.id;
        console.log('👤 [CREATE-CHECKOUT] Utilisateur authentifié:', userId);
      } catch (authError) {
        console.log("👤 [CREATE-CHECKOUT] Utilisateur non authentifié, commande en tant qu'invité");
      }
    }
    
    // Créer ou récupérer le client Stripe
    let customerId: string | undefined;
    try {
      console.log('🔍 [CREATE-CHECKOUT] Recherche client Stripe pour:', orderData.clientEmail);
      const { data: customers } = await stripe.customers.list({
        email: orderData.clientEmail,
        limit: 1,
      });
      
      if (customers && customers.length > 0) {
        customerId = customers[0].id;
        console.log('👤 [CREATE-CHECKOUT] Client Stripe existant:', customerId);
      } else {
        console.log('👤 [CREATE-CHECKOUT] Création nouveau client Stripe...');
        const newCustomer = await stripe.customers.create({
          email: orderData.clientEmail,
          name: orderData.clientName,
          phone: orderData.clientPhone,
        });
        customerId = newCustomer.id;
        console.log('👤 [CREATE-CHECKOUT] Nouveau client Stripe créé:', customerId);
      }
    } catch (customerError) {
      console.error('❌ [CREATE-CHECKOUT] Erreur client Stripe:', customerError);
      // Continuer sans customerId
    }

    // Créer les éléments de ligne pour Stripe
    console.log('📦 [CREATE-CHECKOUT] Création des éléments de ligne...');
    const lineItems = orderData.items.map(item => {
      console.log('📦 [CREATE-CHECKOUT] Article:', item.menuItem.name, 'prix:', item.menuItem.price);
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.menuItem.name,
            description: item.specialInstructions || undefined,
          },
          unit_amount: Math.round(item.menuItem.price * 100),
        },
        quantity: item.quantity,
      };
    });

    // Ajouter les frais additionnels
    if (orderData.deliveryFee > 0) {
      console.log('🚚 [CREATE-CHECKOUT] Ajout frais de livraison:', orderData.deliveryFee);
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
      console.log('💰 [CREATE-CHECKOUT] Ajout TVA:', orderData.tax);
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
      console.log('💝 [CREATE-CHECKOUT] Ajout pourboire:', orderData.tip);
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Pourboire' },
          unit_amount: Math.round(orderData.tip * 100),
        },
        quantity: 1,
      });
    }

    console.log('💳 [CREATE-CHECKOUT] Création session Stripe avec', lineItems.length, 'articles');
    
    // Créer la session Stripe Checkout
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: !customerId ? orderData.clientEmail : undefined,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${orderData.successUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: orderData.cancelUrl,
        metadata: {
          user_id: userId || 'guest',
          order_type: orderData.orderType,
          scheduled_for: orderData.scheduledFor,
          customer_notes: orderData.customerNotes || '',
          restaurant_id: orderData.restaurantId || '11111111-1111-1111-1111-111111111111',
          delivery_address: orderData.orderType === 'delivery' ? 
            `${orderData.deliveryStreet}, ${orderData.deliveryPostalCode} ${orderData.deliveryCity}` : '',
        },
      });
      console.log('✅ [CREATE-CHECKOUT] Session Stripe créée:', session.id);
    } catch (stripeSessionError) {
      console.error('❌ [CREATE-CHECKOUT] Erreur création session Stripe:', stripeSessionError);
      return new Response(
        JSON.stringify({ error: 'Erreur création session de paiement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer la commande dans Supabase
    const restaurantId = orderData.restaurantId || '11111111-1111-1111-1111-111111111111';
    
    try {
      console.log('💾 [CREATE-CHECKOUT] Création commande en base...');
      const { data: orderRecord, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId,
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
        console.error("❌ [CREATE-CHECKOUT] Erreur création commande:", orderError);
        throw new Error(`Erreur base de données: ${orderError.message}`);
      }

      console.log('✅ [CREATE-CHECKOUT] Commande créée avec ID:', orderRecord.id);

      // Ajouter les articles de la commande
      console.log('📦 [CREATE-CHECKOUT] Ajout des articles de commande...');
      const orderItemsPromises = orderData.items.map(item => 
        supabaseAdmin
          .from('order_items')
          .insert({
            order_id: orderRecord.id,
            product_id: item.menuItem.id,
            quantity: item.quantity,
            price: item.menuItem.price,
            special_instructions: item.specialInstructions
          })
      );

      const orderItemsResults = await Promise.allSettled(orderItemsPromises);
      const failedItems = orderItemsResults.filter(result => result.status === 'rejected');
      
      if (failedItems.length > 0) {
        console.error('⚠️ [CREATE-CHECKOUT] Erreurs articles commande:', failedItems);
      } else {
        console.log('✅ [CREATE-CHECKOUT] Articles commande ajoutés:', orderData.items.length);
      }
      
      // Retourner l'URL de la session
      console.log('🎉 [CREATE-CHECKOUT] Succès! Retour URL session');
      return new Response(
        JSON.stringify({ 
          url: session.url,
          sessionId: session.id,
          orderId: orderRecord.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (dbError) {
      console.error('❌ [CREATE-CHECKOUT] Erreur base de données:', dbError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la sauvegarde de la commande' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('❌ [CREATE-CHECKOUT] Erreur générale:', err);
    
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Une erreur inconnue est survenue',
        details: err instanceof Error ? err.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
