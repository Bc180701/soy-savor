
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
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id, status, total, client_email, order_type, restaurant_id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (existingOrderError) {
      console.error('❌ Erreur lors de la vérification commande existante:', existingOrderError);
    }

    if (existingOrder) {
      console.log('✅ Commande déjà existante:', existingOrder.id);
      
      // Récupérer les détails complets de la commande existante
      const { data: orderDetails, error: detailsError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description, price)
          )
        `)
        .eq('id', existingOrder.id)
        .single();

      if (detailsError) {
        console.error('❌ Erreur récupération détails commande:', detailsError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        orderId: existingOrder.id,
        message: 'Commande déjà créée',
        orderDetails: orderDetails || existingOrder
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Récupérer la clé Stripe depuis les variables d'environnement directement
    console.log('🔑 Récupération clé Stripe...');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      console.error('❌ Clé Stripe non disponible dans les variables d\'environnement');
      throw new Error('Clé Stripe non disponible');
    }

    console.log('✅ Clé Stripe récupérée depuis les variables d\'environnement');

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    console.log('💳 Récupération session Stripe...');
    
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items']
      });
    } catch (stripeError) {
      console.error('❌ Erreur Stripe lors de la récupération de session:', stripeError);
      throw new Error(`Erreur Stripe: ${stripeError.message}`);
    }
    
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
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (!usersError) {
        const user = users?.find(u => u.email === session.customer_email);
        userId = user?.id || null;
        console.log('👤 Utilisateur trouvé:', userId ? 'Oui' : 'Non', 'pour email:', session.customer_email);
      }
    }

    // Déterminer le restaurant ID depuis les métadonnées ou utiliser Châteaurenard par défaut
    const restaurantId = metadata.restaurant_id || '11111111-1111-1111-1111-111111111111';
    console.log('🏪 Restaurant ID utilisé:', restaurantId);

    // Créer la commande avec les données des métadonnées
    const orderData = {
      stripe_session_id: sessionId,
      restaurant_id: restaurantId,
      user_id: userId,
      subtotal: parseFloat(metadata.subtotal || '0'),
      tax: parseFloat(metadata.tax || '0'),
      delivery_fee: parseFloat(metadata.delivery_fee || '0'),
      tip: parseFloat(metadata.tip || '0'),
      total: parseFloat(metadata.total || session.amount_total ? (session.amount_total / 100).toString() : '0'),
      discount: parseFloat(metadata.discount || '0'),
      promo_code: metadata.promo_code || null,
      order_type: metadata.order_type || 'pickup',
      status: 'confirmed',
      payment_method: 'credit-card',
      payment_status: 'paid',
      scheduled_for: metadata.scheduled_for || new Date().toISOString(),
      client_name: metadata.client_name || session.customer_details?.name || 'Client',
      client_email: metadata.client_email || session.customer_email || '',
      client_phone: metadata.client_phone || session.customer_details?.phone || '',
      delivery_street: metadata.delivery_street || null,
      delivery_city: metadata.delivery_city || null,
      delivery_postal_code: metadata.delivery_postal_code || null,
      customer_notes: metadata.customer_notes || null,
    };

    console.log('📝 Création commande avec:', {
      restaurant_id: orderData.restaurant_id,
      total: orderData.total,
      client_email: orderData.client_email,
      order_type: orderData.order_type,
      payment_status: orderData.payment_status
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

    // Ajouter les articles depuis items_summary ou items dans les métadonnées
    const itemsData = metadata.items_summary || metadata.items;
    if (itemsData) {
      try {
        const items = JSON.parse(itemsData);
        console.log('📦 Ajout articles:', items.length);

        let orderItems = [];
        
        if (Array.isArray(items)) {
          orderItems = items.map((item: any) => ({
            order_id: order.id,
            product_id: item.id || item.menuItem?.id || item.product_id,
            quantity: item.quantity || 1,
            price: item.price || item.menuItem?.price || 0,
            special_instructions: item.specialInstructions || item.special_instructions || null,
          }));
        }

        if (orderItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            console.error('❌ Erreur ajout articles:', itemsError);
          } else {
            console.log('✅ Articles ajoutés avec succès');
          }
        }
      } catch (error) {
        console.error('❌ Erreur parsing items:', error);
      }
    } else {
      console.log('⚠️ Aucun article trouvé dans les métadonnées');
    }

    // Récupérer les détails complets de la commande créée
    const { data: fullOrderDetails, error: fullDetailsError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, description, price)
        )
      `)
      .eq('id', order.id)
      .single();

    if (fullDetailsError) {
      console.error('❌ Erreur récupération détails complets:', fullDetailsError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      message: 'Commande créée avec succès',
      orderDetails: fullOrderDetails || {
        id: order.id,
        status: order.status,
        total: order.total,
        client_email: order.client_email,
        order_type: order.order_type,
        restaurant_id: order.restaurant_id
      }
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
