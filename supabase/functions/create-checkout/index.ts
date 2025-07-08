
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';
import Stripe from 'https://cdn.skypack.dev/stripe@14.20.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      items, 
      subtotal, 
      tax, 
      deliveryFee, 
      tip = 0, 
      discount = 0, 
      promoCode,
      total, 
      orderType, 
      clientName, 
      clientEmail, 
      clientPhone,
      deliveryStreet,
      deliveryCity,
      deliveryPostalCode,
      customerNotes,
      scheduledFor,
      restaurantId, // Important: récupérer l'ID du restaurant
      successUrl,
      cancelUrl
    } = await req.json();

    console.log('🏪 Création checkout pour restaurant:', restaurantId);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Créer les line items pour Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.menuItem.name,
          description: item.menuItem.description || '',
        },
        unit_amount: Math.round(item.menuItem.price * 100), // Prix en centimes
      },
      quantity: item.quantity,
    }));

    // Ajouter les frais de livraison si applicable
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    // Ajouter le pourboire si applicable
    if (tip > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Pourboire',
          },
          unit_amount: Math.round(tip * 100),
        },
        quantity: 1,
      });
    }

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: clientEmail,
      metadata: {
        restaurant_id: restaurantId, // Ajouter l'ID du restaurant dans les métadonnées
        order_type: orderType,
        client_name: clientName,
        client_phone: clientPhone,
      },
    });

    console.log('💳 Session Stripe créée:', session.id);

    // Créer la commande dans Supabase AVEC le restaurant_id
    const orderData = {
      stripe_session_id: session.id,
      restaurant_id: restaurantId, // IMPORTANT: associer au bon restaurant
      subtotal,
      tax,
      delivery_fee: deliveryFee,
      tip,
      total,
      discount,
      promo_code: promoCode,
      order_type: orderType,
      status: 'pending',
      payment_method: 'credit-card',
      payment_status: 'pending',
      scheduled_for: scheduledFor,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      delivery_street: deliveryStreet,
      delivery_city: deliveryCity,
      delivery_postal_code: deliveryPostalCode,
      customer_notes: customerNotes,
    };

    console.log('📝 Création commande avec restaurant:', restaurantId);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Erreur création commande:', orderError);
      throw orderError;
    }

    console.log('✅ Commande créée avec ID:', order.id, 'pour restaurant:', restaurantId);

    // Ajouter les articles de la commande
    const orderItemPromises = items.map((item: any) => {
      return supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          special_instructions: item.specialInstructions,
        });
    });

    await Promise.all(orderItemPromises);
    console.log('✅ Articles de commande ajoutés');

    return new Response(JSON.stringify({ 
      url: session.url,
      orderId: order.id,
      restaurantId: restaurantId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur dans create-checkout:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
