
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
    console.log('🚀 create-checkout function called');
    
    // Vérifier la clé Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('❌ STRIPE_SECRET_KEY not configured');
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
    console.log('📦 Order data received:', {
      itemCount: orderData.items.length,
      total: orderData.total,
      orderType: orderData.orderType,
      clientEmail: orderData.clientEmail
    });
    
    // Initialiser Supabase client avec la clé de service pour bypasser RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Configuration Supabase manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client avec rôle de service pour les opérations de base de données (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Créer ou récupérer le client Stripe
    let customerId: string | undefined;
    
    if (orderData.clientEmail) {
      console.log('🔍 Looking for existing Stripe customer:', orderData.clientEmail);
      const { data: customers } = await stripe.customers.list({
        email: orderData.clientEmail,
        limit: 1,
      });
      
      if (customers && customers.length > 0) {
        customerId = customers[0].id;
        console.log('✅ Found existing customer:', customerId);
      } else {
        // Créer un nouveau client
        console.log('👤 Creating new Stripe customer');
        const newCustomer = await stripe.customers.create({
          email: orderData.clientEmail,
          name: orderData.clientName,
          phone: orderData.clientPhone,
        });
        customerId = newCustomer.id;
        console.log('✅ Created new customer:', customerId);
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

    console.log('💳 Creating Stripe checkout session with', lineItems.length, 'line items');
    
    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: !customerId ? orderData.clientEmail : undefined,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: orderData.successUrl,
      cancel_url: orderData.cancelUrl,
      metadata: {
        order_type: orderData.orderType,
        scheduled_for: orderData.scheduledFor,
        customer_notes: orderData.customerNotes || '',
        delivery_address: orderData.orderType === 'delivery' ? 
          `${orderData.deliveryStreet}, ${orderData.deliveryPostalCode} ${orderData.deliveryCity}` : '',
        tip_amount: orderData.tip ? (orderData.tip).toString() : '0',
        discount_amount: orderData.discount ? (orderData.discount).toString() : '0',
        promo_code: orderData.promoCode || '',
      },
    });

    console.log('✅ Stripe session created:', session.id);

    // Créer la commande dans Supabase AVANT de renvoyer l'URL
    console.log('💾 Creating order in database...');
    const { data: orderRecord, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        subtotal: Number(orderData.subtotal) || 0,
        tax: Number(orderData.tax) || 0,
        delivery_fee: Number(orderData.deliveryFee) || 0,
        tip: Number(orderData.tip) || 0,
        discount: Number(orderData.discount) || 0,
        promo_code: orderData.promoCode || null,
        total: Number(orderData.total) || 0,
        order_type: orderData.orderType || 'delivery',
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
        stripe_session_id: session.id,
        restaurant_id: '11111111-1111-1111-1111-111111111111' // ID par défaut Châteaurenard
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: `Erreur lors de la création de la commande: ${orderError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Order created in database:', orderRecord.id);

    // Ajouter les articles de la commande
    console.log('📋 Adding order items...');
    for (const item of orderData.items) {
      const { error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert({
          order_id: orderRecord.id,
          product_id: item.menuItem.id,
          quantity: Number(item.quantity) || 1,
          price: Number(item.menuItem.price) || 0,
          special_instructions: item.specialInstructions || null
        });

      if (itemError) {
        console.error('❌ Error creating order item:', itemError);
        // Continue même en cas d'erreur sur un item
      }
    }

    console.log('✅ Order items added successfully');
    console.log('🎉 Order creation completed, returning Stripe URL');
    
    // Renvoyer l'URL de la session
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    // Gérer les erreurs
    console.error('❌ Error in create-checkout:', err);
    
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Une erreur inconnue est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
