
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.20.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    console.log('=== DÉBUT WEBHOOK STRIPE ===');
    
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Signature manquante');
      return new Response('Signature manquante', { status: 400 });
    }

    // Récupérer le corps brut de la requête
    const body = await req.text();
    
    // Récupérer le secret du webhook depuis les variables d'environnement
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('Clé secrète du webhook non configurée');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Vérifier la signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('Événement Stripe vérifié:', event.type);
    } catch (err) {
      console.error(`Erreur de signature du webhook: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Traiter l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Session de paiement complétée:', session.id);
      
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
        console.log('Commande trouvée, mise à jour du statut:', orderId);
        
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
        
        console.log('Commande mise à jour avec succès:', orderId);
      } else {
        console.warn('Aucune commande trouvée pour la session:', session.id);
      }
    }

    console.log('=== FIN WEBHOOK STRIPE SUCCÈS ===');
    
    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (err) {
    console.error('=== ERREUR WEBHOOK STRIPE ===', err);
    return new Response(`Webhook error: ${err.message}`, { status: 500 });
  }
});
