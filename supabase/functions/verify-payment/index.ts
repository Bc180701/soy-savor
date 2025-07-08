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

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY non configurée');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

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

    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('💳 Session Stripe récupérée:', session.payment_status);

    if (session.payment_status !== 'paid') {
      throw new Error(`Paiement non confirmé. Statut: ${session.payment_status}`);
    }

    // Récupérer les métadonnées
    const metadata = session.metadata;
    if (!metadata.restaurant_id) {
      throw new Error('Métadonnées incomplètes');
    }

    console.log('📋 Création commande depuis métadonnées Stripe');

    // Vérifier si l'utilisateur est connecté en récupérant son email depuis Stripe
    let userId = null;
    if (session.customer_email) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData.users?.find(u => u.email === session.customer_email);
      userId = user?.id || null;
      console.log('👤 Utilisateur trouvé:', userId ? 'Oui' : 'Non', 'pour email:', session.customer_email);
    }

    // Créer la commande
    const orderData = {
      stripe_session_id: sessionId,
      restaurant_id: metadata.restaurant_id,
      user_id: userId,
      subtotal: parseFloat(metadata.subtotal || '0'),
      tax: parseFloat(metadata.tax || '0'),
      delivery_fee: parseFloat(metadata.delivery_fee || '0'),
      tip: parseFloat(metadata.tip || '0'),
      total: parseFloat(metadata.total || '0'),
      discount: parseFloat(metadata.discount || '0'),
      promo_code: metadata.promo_code || null,
      order_type: metadata.order_type,
      status: 'confirmed',
      payment_method: 'credit-card',
      payment_status: 'paid',
      scheduled_for: metadata.scheduled_for || new Date().toISOString(),
      client_name: metadata.client_name,
      client_email: metadata.client_email,
      client_phone: metadata.client_phone,
      delivery_street: metadata.delivery_street || null,
      delivery_city: metadata.delivery_city || null,
      delivery_postal_code: metadata.delivery_postal_code || null,
      customer_notes: metadata.customer_notes || null,
    };

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

    // Ajouter les articles
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
          throw itemsError;
        }

        console.log('✅ Articles ajoutés');
      } catch (error) {
        console.error('❌ Erreur parsing items:', error);
      }
    }

    // Envoyer la notification email au client
    if (order.client_email && order.client_name) {
      try {
        console.log('📧 Envoi notification email à:', order.client_email);
        const { error: emailError } = await supabase.functions.invoke('send-email-notification', {
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