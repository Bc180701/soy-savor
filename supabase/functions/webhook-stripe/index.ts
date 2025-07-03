
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0?dts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Signature manquante', { status: 400 });
    }

    // Récupérer le corps brut de la requête
    const body = await req.text();
    
    // Récupérer le secret du webhook depuis les variables d'environnement
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!webhookSecret) {
      console.error('Clé secrète du webhook non configurée');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    if (!stripeSecretKey) {
      console.error('Clé secrète Stripe non configurée');
      return new Response('Stripe secret key not configured', { status: 500 });
    }

    // Vérifier la signature du webhook avec l'API Stripe
    const timestampHeader = req.headers.get('stripe-signature');
    const elements = timestampHeader?.split(',');
    const timestamp = elements?.find(element => element.startsWith('t='))?.substring(2);
    const v1 = elements?.find(element => element.startsWith('v1='))?.substring(3);

    if (!timestamp || !v1) {
      console.error('Signature invalide');
      return new Response('Invalid signature format', { status: 400 });
    }

    // Créer la payload pour vérification
    const payload = timestamp + '.' + body;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const payloadData = encoder.encode(payload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
    const signature_hex = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature_hex !== v1) {
      console.error('Signature webhook invalide');
      return new Response('Invalid webhook signature', { status: 400 });
    }

    // Parser l'événement
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error(`Erreur parsing JSON: ${err.message}`);
      return new Response(`Invalid JSON: ${err.message}`, { status: 400 });
    }

    console.log(`Événement reçu: ${event.type}`);

    // Traiter l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log(`Session complétée: ${session.id}`);
      
      // Mettre à jour la commande avec le statut "paid"
      const { data: orders, error: findError } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .limit(1);

      if (findError) {
        console.error('Erreur lors de la recherche de la commande:', findError);
        return new Response('Erreur lors de la recherche de la commande', { status: 500 });
      }

      if (orders && orders.length > 0) {
        const orderId = orders[0].id;
        console.log(`Mise à jour commande: ${orderId}`);
        
        // Mettre à jour le statut de paiement et de commande
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'confirmed' 
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Erreur lors de la mise à jour de la commande:', updateError);
          return new Response('Erreur lors de la mise à jour de la commande', { status: 500 });
        }

        console.log(`Commande ${orderId} mise à jour avec succès`);
      } else {
        console.warn('Aucune commande trouvée pour la session:', session.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (err) {
    console.error('Erreur du webhook:', err);
    return new Response(`Webhook error: ${err.message}`, { status: 500 });
  }
});
