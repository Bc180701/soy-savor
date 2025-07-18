
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
    console.log('🚀 Début verify-payment');
    
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID manquant');
    }

    console.log('🔍 Vérification session:', sessionId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Vérifier si la commande existe déjà
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (existingOrder) {
      console.log('✅ Commande déjà existante:', existingOrder.id);
      return new Response(JSON.stringify({ 
        success: true, 
        orderId: existingOrder.id,
        message: 'Commande déjà créée'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Récupérer la clé Stripe depuis la fonction get-stripe-key
    console.log('🔑 Récupération clé Stripe...');
    const { data: stripeKeyData, error: keyError } = await supabase.functions.invoke('get-stripe-key', {
      body: { restaurantId: '11111111-1111-1111-1111-111111111111' }
    });

    if (keyError || !stripeKeyData?.stripeKey) {
      console.error('❌ Erreur récupération clé Stripe:', keyError);
      throw new Error('Clé Stripe non disponible');
    }

    console.log('✅ Clé Stripe récupérée');

    const stripe = new Stripe(stripeKeyData.stripeKey, {
      apiVersion: '2023-10-16',
    });

    console.log('💳 Récupération session Stripe...');
    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('📊 Session récupérée:', {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      customer_email: session.customer_email,
      metadata_keys: Object.keys(session.metadata || {})
    });

    if (session.payment_status !== 'paid') {
      throw new Error(`Paiement non confirmé. Statut: ${session.payment_status}`);
    }

    // Récupérer les métadonnées
    const metadata = session.metadata || {};
    console.log('📋 Métadonnées disponibles:', metadata);

    // Vérifier si l'utilisateur est connecté
    let userId = null;
    if (session.customer_email) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users?.find(u => u.email === session.customer_email);
      userId = user?.id || null;
      console.log('👤 Utilisateur trouvé:', userId ? 'Oui' : 'Non', 'pour email:', session.customer_email);
    }

    // Créer la commande avec les données des métadonnées
    const orderData = {
      stripe_session_id: sessionId,
      restaurant_id: metadata.restaurant_id || '11111111-1111-1111-1111-111111111111',
      user_id: userId,
      subtotal: parseFloat(metadata.subtotal || '0'),
      tax: parseFloat(metadata.tax || '0'),
      delivery_fee: parseFloat(metadata.delivery_fee || '0'),
      tip: parseFloat(metadata.tip || '0'),
      total: parseFloat(metadata.total || '0'),
      discount: parseFloat(metadata.discount || '0'),
      promo_code: metadata.promo_code || null,
      order_type: metadata.order_type || 'pickup',
      status: 'confirmed',
      payment_method: 'credit-card',
      payment_status: 'paid',
      scheduled_for: metadata.scheduled_for || new Date().toISOString(),
      client_name: metadata.client_name || session.customer_details?.name || 'Client',
      client_email: metadata.client_email || session.customer_email || '',
      client_phone: metadata.client_phone || '',
      delivery_street: metadata.delivery_street || null,
      delivery_city: metadata.delivery_city || null,
      delivery_postal_code: metadata.delivery_postal_code || null,
      customer_notes: metadata.customer_notes || null,
    };

    console.log('📝 Création commande avec:', {
      restaurant_id: orderData.restaurant_id,
      total: orderData.total,
      client_email: orderData.client_email,
      order_type: orderData.order_type
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Erreur création commande:', orderError);
      throw orderError;
    }

    console.log('✅ Commande créée:', order.id);

    // Ajouter les articles depuis items_summary dans les métadonnées
    if (metadata.items_summary) {
      try {
        const items = JSON.parse(metadata.items_summary);
        console.log('📦 Ajout articles depuis items_summary:', items.length);

        const orderItems = items.map((item: any) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          special_instructions: null,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('❌ Erreur ajout articles:', itemsError);
          throw itemsError;
        }

        console.log('✅ Articles ajoutés depuis items_summary');
      } catch (error) {
        console.error('❌ Erreur parsing items_summary:', error);
      }
    } else {
      console.log('⚠️ Aucun items_summary trouvé dans les métadonnées');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      message: 'Commande créée avec succès'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur verify-payment:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
