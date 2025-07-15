
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
    console.log('🚀 Début create-checkout');
    
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
      restaurantId,
      successUrl,
      cancelUrl
    } = await req.json();

    console.log('📋 Données reçues:', { 
      items: items?.length, 
      subtotal, 
      total, 
      restaurantId,
      clientEmail 
    });

    // Utiliser le restaurant fourni ou le restaurant par défaut (Châteaurenard)
    const targetRestaurantId = restaurantId || "11111111-1111-1111-1111-111111111111";
    console.log('🏪 Création checkout pour restaurant:', targetRestaurantId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Récupérer la clé Stripe spécifique au restaurant
    console.log('🔑 Récupération clé Stripe pour restaurant:', targetRestaurantId);
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('settings')
      .eq('id', targetRestaurantId)
      .single();

    if (restaurantError) {
      console.error('Erreur récupération restaurant:', restaurantError);
      throw restaurantError;
    }

    // Utiliser la clé spécifique au restaurant ou la clé par défaut
    let stripeSecretKey = restaurant?.settings?.stripe_secret_key;
    
    if (!stripeSecretKey) {
      console.log('⚠️ Pas de clé spécifique, utilisation clé par défaut');
      stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    }
    
    console.log('🔑 Clé Stripe:', stripeSecretKey ? 'Présente' : 'MANQUANTE');
    
    if (!stripeSecretKey) {
      throw new Error('Aucune clé Stripe configurée pour ce restaurant');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Créer les line items pour Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.menuItem.name,
          description: item.menuItem.description || '',
        },
        unit_amount: Math.round(item.menuItem.price * 100),
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

    // Créer la session Stripe avec TOUTES les données dans les métadonnées
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: clientEmail,
      metadata: {
        restaurant_id: targetRestaurantId,
        order_type: orderType,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        delivery_street: deliveryStreet || '',
        delivery_city: deliveryCity || '',
        delivery_postal_code: deliveryPostalCode || '',
        customer_notes: customerNotes || '',
        scheduled_for: scheduledFor || '',
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        delivery_fee: deliveryFee.toString(),
        tip: tip.toString(),
        discount: discount.toString(),
        promo_code: promoCode || '',
        total: total.toString(),
        items: JSON.stringify(items)
      },
    });

    console.log('💳 Session Stripe créée:', session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      restaurantId: targetRestaurantId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur détaillée dans create-checkout:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Voir les logs pour plus de détails'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
