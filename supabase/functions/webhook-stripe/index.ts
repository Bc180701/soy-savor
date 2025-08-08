import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Fonction pour vérifier la signature Stripe avec Web Crypto API
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find(part => part.startsWith('t='))?.split('=')[1];
    const sig = parts.find(part => part.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !sig) return false;
    
    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expected_sig = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expected_sig === sig;
  } catch (error) {
    console.error('Erreur vérification signature:', error);
    return false;
  }
}

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Signature manquante', { status: 400 });
    }

    const body = await req.text();
    
    // Essayer les deux secrets de webhook (Châteaurenard et St Martin)
    const webhookSecretChato = Deno.env.get('STRIPE_WEBHOOK_SECRET_CHATEAURENARD');
    const webhookSecretStMartin = Deno.env.get('STRIPE_WEBHOOK_SECRET_ST_MARTIN');
    
    let isValidSignature = false;
    let usedSecret = '';
    
    // Essayer d'abord avec le secret de Châteaurenard
    if (webhookSecretChato) {
      isValidSignature = await verifyStripeSignature(body, signature, webhookSecretChato);
      if (isValidSignature) {
        usedSecret = 'CHATEAURENARD';
        console.log('✅ Signature validée avec le secret de Châteaurenard');
      }
    }
    
    // Si ça n'a pas marché, essayer avec le secret de St Martin
    if (!isValidSignature && webhookSecretStMartin) {
      isValidSignature = await verifyStripeSignature(body, signature, webhookSecretStMartin);
      if (isValidSignature) {
        usedSecret = 'ST_MARTIN';
        console.log('✅ Signature validée avec le secret de St Martin de Crau');
      }
    }
    
    if (!isValidSignature) {
      console.error('❌ Signature du webhook invalide avec les deux secrets');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('🎯 Événement Stripe reçu:', event.type);

    // Traiter l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('💳 Session complétée:', session.id);
      
      // Initialiser Stripe pour récupérer les line_items complets
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16',
      });
      
      // Vérifier si la commande existe déjà
      const { data: existingOrder, error: existingError } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (existingError) {
        console.error('❌ Erreur vérification commande existante:', existingError);
      }

      if (existingOrder) {
        console.log('✅ Commande déjà existante:', existingOrder.id);
        return new Response(JSON.stringify({ received: true, existing: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Récupérer toutes les données depuis les métadonnées
      const metadata = session.metadata;
      const restaurantId = metadata?.restaurant_id || '22222222-2222-2222-2222-222222222222'; // St Martin de Crau par défaut
      
      console.log('🏪 Restaurant ID depuis métadonnées:', restaurantId);
      console.log('📋 Métadonnées complètes:', metadata);
      
      if (!restaurantId) {
        console.error('❌ Restaurant ID manquant dans les métadonnées');
        return new Response('Restaurant ID manquant', { status: 400 });
      }

      // Vérifier si l'utilisateur existe
      let userId = null;
      if (session.customer_email) {
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError) {
          const user = users?.find(u => u.email === session.customer_email);
          userId = user?.id || null;
          console.log('👤 Utilisateur trouvé:', userId ? 'Oui' : 'Non', 'pour email:', session.customer_email);
        }
      }

      // Récupérer les vrais line_items depuis Stripe
      let itemsSummary = [];
      try {
        console.log('🔍 Récupération des line_items depuis Stripe...');
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        });
        
        itemsSummary = lineItems.data.map((item: any) => ({
          id: item.price?.product?.metadata?.product_id || item.price?.product?.id || 'unknown',
          name: item.description || item.price?.product?.name || 'Produit inconnu',
          price: (item.amount_total || 0) / 100,
          quantity: item.quantity || 1,
          unit_price: (item.price?.unit_amount || 0) / 100
        }));
        
        console.log('✅ Line items récupérés:', itemsSummary.length, 'articles');
        console.log('📋 Détail des articles:', itemsSummary);
      } catch (stripeError) {
        console.error('❌ Erreur récupération line_items Stripe:', stripeError);
        // Fallback sur les métadonnées si l'API Stripe échoue
        itemsSummary = metadata?.items_summary ? JSON.parse(metadata.items_summary) : [];
        console.log('⚠️ Utilisation du fallback métadonnées:', itemsSummary.length, 'articles');
      }
      
      const orderData = {
        stripe_session_id: session.id,
        restaurant_id: restaurantId,
        user_id: userId,
        subtotal: parseFloat(metadata?.subtotal || '0'),
        tax: parseFloat(metadata?.tax || '0'),
        delivery_fee: parseFloat(metadata?.delivery_fee || '0'),
        tip: parseFloat(metadata?.tip || '0'),
        total: parseFloat(metadata?.total || session.amount_total ? (session.amount_total / 100).toString() : '0'),
        discount: parseFloat(metadata?.discount || '0'),
        promo_code: metadata?.promo_code || null,
        order_type: metadata?.order_type || 'pickup',
        status: 'confirmed',
        payment_method: 'credit-card',
        payment_status: 'paid',
        scheduled_for: metadata?.scheduled_for || new Date().toISOString(),
        client_name: metadata?.client_name || session.customer_details?.name || 'Client',
        client_email: metadata?.client_email || session.customer_email || '',
        client_phone: metadata?.client_phone || session.customer_details?.phone || '',
        delivery_street: metadata?.delivery_street || null,
        delivery_city: metadata?.delivery_city || null,
        delivery_postal_code: metadata?.delivery_postal_code || null,
        customer_notes: metadata?.customer_notes || null,
        items_summary: itemsSummary,
      };

      console.log('📝 Création commande depuis webhook:', {
        restaurant_id: orderData.restaurant_id,
        total: orderData.total,
        client_email: orderData.client_email,
        order_type: orderData.order_type,
        items_count: itemsSummary.length
      });

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('❌ Erreur création commande depuis webhook:', orderError);
        throw orderError;
      }

      console.log('✅ Commande créée avec ID:', order.id, 'pour restaurant:', restaurantId, 'avec', itemsSummary.length, 'articles');

      return new Response(JSON.stringify({ 
        received: true, 
        orderId: order.id,
        itemsCount: itemsSummary.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.log('ℹ️ Événement ignoré:', event.type);
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});