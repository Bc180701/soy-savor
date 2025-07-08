
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';

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
    
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Clé secrète du webhook non configurée');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Vérifier la signature
    const isValidSignature = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValidSignature) {
      console.error('Signature du webhook invalide');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('🎯 Événement Stripe reçu:', event.type);

    // Traiter l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('💳 Session complétée:', session.id);
      
      // Récupérer l'ID du restaurant depuis les métadonnées
      const restaurantId = session.metadata?.restaurant_id;
      console.log('🏪 Restaurant ID depuis métadonnées:', restaurantId);
      
      // Trouver la commande correspondante
      const { data: orders, error: findError } = await supabase
        .from('orders')
        .select('id, restaurant_id')
        .eq('stripe_session_id', session.id);

      if (findError) {
        console.error('Erreur lors de la recherche de la commande:', findError);
        return new Response('Erreur lors de la recherche de la commande', { status: 500 });
      }

      if (orders && orders.length > 0) {
        const order = orders[0];
        console.log('📋 Commande trouvée:', order.id, 'Restaurant:', order.restaurant_id);
        
        // Mettre à jour le statut de paiement et de commande
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'confirmed'
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('Erreur lors de la mise à jour de la commande:', updateError);
          return new Response('Erreur lors de la mise à jour de la commande', { status: 500 });
        }

        console.log('✅ Commande', order.id, 'mise à jour avec succès pour restaurant', order.restaurant_id);
      } else {
        console.warn('⚠️ Aucune commande trouvée pour la session:', session.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (err) {
    console.error('❌ Erreur du webhook:', err);
    return new Response(`Webhook error: ${err.message}`, { status: 500 });
  }
});
