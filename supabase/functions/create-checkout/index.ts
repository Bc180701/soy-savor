
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
  console.log('🚀 [CREATE-CHECKOUT] Function started');
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ [CREATE-CHECKOUT] CORS preflight handled');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Check method
    if (req.method !== 'POST') {
      console.log('❌ [CREATE-CHECKOUT] Invalid method:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let orderData: OrderData;
    try {
      const body = await req.text();
      console.log('📨 [CREATE-CHECKOUT] Body received, length:', body.length);
      orderData = JSON.parse(body);
      console.log('✅ [CREATE-CHECKOUT] Data parsed successfully');
    } catch (parseError) {
      console.error('❌ [CREATE-CHECKOUT] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required data
    if (!orderData.items || orderData.items.length === 0) {
      console.log('❌ [CREATE-CHECKOUT] No items in order');
      return new Response(
        JSON.stringify({ error: 'No items in order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!orderData.clientEmail || !orderData.clientName) {
      console.log('❌ [CREATE-CHECKOUT] Missing client info:', {
        email: !!orderData.clientEmail,
        name: !!orderData.clientName
      });
      return new Response(
        JSON.stringify({ error: 'Missing client information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [CREATE-CHECKOUT] Data validation passed');

    // Check Stripe key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('❌ [CREATE-CHECKOUT] Missing Stripe key');
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ [CREATE-CHECKOUT] Stripe key found');
    
    // Initialize Stripe
    let stripe: Stripe;
    try {
      stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
      console.log('✅ [CREATE-CHECKOUT] Stripe initialized');
    } catch (stripeError) {
      console.error('❌ [CREATE-CHECKOUT] Stripe initialization error:', stripeError);
      return new Response(
        JSON.stringify({ error: 'Stripe initialization failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [CREATE-CHECKOUT] Missing Supabase config');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ [CREATE-CHECKOUT] Supabase config OK');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create Stripe customer
    let customerId: string | undefined;
    try {
      console.log('🔍 [CREATE-CHECKOUT] Looking for Stripe customer:', orderData.clientEmail);
      const { data: customers } = await stripe.customers.list({
        email: orderData.clientEmail,
        limit: 1,
      });
      
      if (customers && customers.length > 0) {
        customerId = customers[0].id;
        console.log('👤 [CREATE-CHECKOUT] Existing customer found:', customerId);
      } else {
        console.log('👤 [CREATE-CHECKOUT] Creating new customer...');
        const newCustomer = await stripe.customers.create({
          email: orderData.clientEmail,
          name: orderData.clientName,
          phone: orderData.clientPhone,
        });
        customerId = newCustomer.id;
        console.log('👤 [CREATE-CHECKOUT] New customer created:', customerId);
      }
    } catch (customerError) {
      console.error('❌ [CREATE-CHECKOUT] Customer error:', customerError);
      // Continue without customer ID
    }

    // Create line items
    console.log('📦 [CREATE-CHECKOUT] Creating line items...');
    const lineItems = orderData.items.map(item => {
      console.log('📦 [CREATE-CHECKOUT] Item:', item.menuItem.name, 'price:', item.menuItem.price);
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

    // Add additional fees
    if (orderData.deliveryFee > 0) {
      console.log('🚚 [CREATE-CHECKOUT] Adding delivery fee:', orderData.deliveryFee);
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
      console.log('💰 [CREATE-CHECKOUT] Adding tax:', orderData.tax);
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
      console.log('💝 [CREATE-CHECKOUT] Adding tip:', orderData.tip);
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Pourboire' },
          unit_amount: Math.round(orderData.tip * 100),
        },
        quantity: 1,
      });
    }

    console.log('💳 [CREATE-CHECKOUT] Creating Stripe session with', lineItems.length, 'items');
    
    // Create Stripe session
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
          order_type: orderData.orderType,
          scheduled_for: orderData.scheduledFor,
          customer_notes: orderData.customerNotes || '',
          restaurant_id: orderData.restaurantId || '11111111-1111-1111-1111-111111111111',
          delivery_address: orderData.orderType === 'delivery' ? 
            `${orderData.deliveryStreet}, ${orderData.deliveryPostalCode} ${orderData.deliveryCity}` : '',
        },
      });
      console.log('✅ [CREATE-CHECKOUT] Stripe session created:', session.id);
    } catch (stripeSessionError) {
      console.error('❌ [CREATE-CHECKOUT] Stripe session error:', stripeSessionError);
      return new Response(
        JSON.stringify({ error: 'Payment session creation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create order in database
    const restaurantId = orderData.restaurantId || '11111111-1111-1111-1111-111111111111';
    
    try {
      console.log('💾 [CREATE-CHECKOUT] Creating order in database...');
      const { data: orderRecord, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
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
        console.error('❌ [CREATE-CHECKOUT] Order creation error:', orderError);
        throw new Error(`Database error: ${orderError.message}`);
      }

      console.log('✅ [CREATE-CHECKOUT] Order created with ID:', orderRecord.id);

      // Add order items
      console.log('📦 [CREATE-CHECKOUT] Adding order items...');
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
        console.error('⚠️ [CREATE-CHECKOUT] Some order items failed:', failedItems);
      } else {
        console.log('✅ [CREATE-CHECKOUT] Order items added:', orderData.items.length);
      }
      
      // Return success response
      console.log('🎉 [CREATE-CHECKOUT] Success! Returning session URL');
      return new Response(
        JSON.stringify({ 
          url: session.url,
          sessionId: session.id,
          orderId: orderRecord.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (dbError) {
      console.error('❌ [CREATE-CHECKOUT] Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Order creation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('❌ [CREATE-CHECKOUT] General error:', err);
    
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        details: err instanceof Error ? err.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
