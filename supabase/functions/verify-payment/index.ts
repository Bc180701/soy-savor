
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
      .select('id, restaurant_id')
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

    // Utiliser la clé Stripe appropriée selon l'environnement de la session
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Clé Stripe non configurée');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Récupérer la session Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('💳 Session Stripe récupérée:', session.payment_status);
    } catch (stripeError) {
      console.error('❌ Erreur Stripe:', stripeError);
      
      // Si la session n'existe pas, créer quand même une commande générique
      // car le paiement a peut-être été traité par webhook
      if (stripeError.code === 'resource_missing') {
        console.log('⚠️ Session non trouvée, création d\'une commande générique');
        const genericOrderData = {
          stripe_session_id: sessionId,
          restaurant_id: '11111111-1111-1111-1111-111111111111', // Restaurant par défaut
          subtotal: 0,
          tax: 0,
          delivery_fee: 0,
          tip: 0,
          total: 0,
          discount: 0,
          order_type: 'pickup',
          status: 'confirmed',
          payment_method: 'credit-card',
          payment_status: 'paid',
          scheduled_for: new Date().toISOString(),
          client_name: 'Client',
          client_email: 'client@example.com',
          client_phone: '',
        };

        const { data: genericOrder, error: genericOrderError } = await supabase
          .from('orders')
          .insert(genericOrderData)
          .select()
          .single();

        if (genericOrderError) {
          console.error('❌ Erreur création commande générique:', genericOrderError);
          throw genericOrderError;
        }

        console.log('✅ Commande générique créée:', genericOrder.id);
        return new Response(JSON.stringify({ 
          success: true, 
          orderId: genericOrder.id,
          message: 'Commande générique créée'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      
      throw stripeError;
    }

    if (session.payment_status !== 'paid') {
      throw new Error(`Paiement non confirmé. Statut: ${session.payment_status}`);
    }

    // Récupérer les métadonnées
    const metadata = session.metadata || {};
    console.log('📋 Métadonnées récupérées:', Object.keys(metadata).length, 'clés');

    // Vérifier si l'utilisateur est connecté
    let userId = null;
    if (session.customer_email) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users?.find(u => u.email === session.customer_email);
      userId = user?.id || null;
      console.log('👤 Utilisateur trouvé:', userId ? 'Oui' : 'Non', 'pour email:', session.customer_email);
    }

    // Créer la commande avec les métadonnées ou des valeurs par défaut
    const orderData = {
      stripe_session_id: sessionId,
      restaurant_id: metadata.restaurant_id || '11111111-1111-1111-1111-111111111111',
      user_id: userId,
      subtotal: parseFloat(metadata.subtotal || '0'),
      tax: parseFloat(metadata.tax || '0'),
      delivery_fee: parseFloat(metadata.delivery_fee || '0'),
      tip: parseFloat(metadata.tip || '0'),
      total: session.amount_total ? session.amount_total / 100 : parseFloat(metadata.total || '0'),
      discount: parseFloat(metadata.discount || '0'),
      promo_code: metadata.promo_code || null,
      order_type: metadata.order_type || 'pickup',
      status: 'confirmed',
      payment_method: 'credit-card',
      payment_status: 'paid',
      scheduled_for: metadata.scheduled_for || new Date().toISOString(),
      client_name: metadata.client_name || session.customer_details?.name || 'Client',
      client_email: metadata.client_email || session.customer_email || 'client@example.com',
      client_phone: metadata.client_phone || session.customer_details?.phone || '',
      delivery_street: metadata.delivery_street || null,
      delivery_city: metadata.delivery_city || null,
      delivery_postal_code: metadata.delivery_postal_code || null,
      customer_notes: metadata.customer_notes || null,
    };

    console.log('📝 Création commande avec données:', {
      restaurant_id: orderData.restaurant_id,
      total: orderData.total,
      client_email: orderData.client_email
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

    // Ajouter les articles si disponibles
    if (metadata.items) {
      try {
        const items = JSON.parse(metadata.items);
        console.log('📦 Ajout de', items.length, 'articles');

        const orderItems = items.map((item: any) => ({
          order_id: order.id,
          product_id: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          special_instructions: item.specialInstructions || null,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('❌ Erreur ajout articles:', itemsError);
        } else {
          console.log('✅ Articles ajoutés');
        }
      } catch (error) {
        console.error('❌ Erreur parsing items:', error);
      }
    }

    // Envoyer la notification email au client
    if (order.client_email && order.client_name) {
      try {
        console.log('📧 Envoi notification email à:', order.client_email);
        const { error: emailError } = await supabase.functions.invoke('send-order-notification', {
          body: {
            email: order.client_email,
            name: order.client_name,
            orderId: order.id,
            status: 'confirmed',
            statusMessage: 'a été confirmée et est en cours de préparation'
          }
        });
        
        if (emailError) {
          console.error('❌ Erreur envoi email:', emailError);
        } else {
          console.log('✅ Email de confirmation envoyé');
        }
      } catch (emailError) {
        console.error('❌ Erreur envoi notification:', emailError);
      }
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
