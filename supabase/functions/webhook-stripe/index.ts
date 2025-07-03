
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
    console.log('🔔 Webhook Stripe reçu');
    
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ Signature manquante');
      return new Response('Signature manquante', { status: 400 });
    }

    // Récupérer le corps brut de la requête
    const body = await req.text();
    
    // Récupérer le secret du webhook
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('❌ Secret webhook non configuré');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Vérifier la signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Signature webhook vérifiée, événement:', event.type);
    } catch (err) {
      console.error(`❌ Erreur signature webhook: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Traiter l'événement checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('💳 Session checkout complétée:', session.id);
      
      // Chercher la commande correspondante
      const { data: orders, error: findError } = await supabase
        .from('orders')
        .select('id, client_email, client_name, total')
        .eq('stripe_session_id', session.id)
        .limit(1);

      if (findError) {
        console.error('❌ Erreur recherche commande:', findError);
        return new Response('Erreur lors de la recherche de la commande', { status: 500 });
      }

      if (orders && orders.length > 0) {
        const order = orders[0];
        console.log('📦 Commande trouvée:', order.id);
        
        // Mettre à jour le statut de paiement et de commande
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'confirmed' 
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('❌ Erreur mise à jour commande:', updateError);
          return new Response('Erreur lors de la mise à jour de la commande', { status: 500 });
        }

        console.log('✅ Commande mise à jour avec succès:', order.id);
        
        // Optionnel : envoyer un email de confirmation
        if (order.client_email && order.client_name) {
          console.log('📧 Envoi email confirmation à:', order.client_email);
          
          try {
            await supabase.functions.invoke('send-order-notification', {
              body: {
                email: order.client_email,
                name: order.client_name,
                orderId: order.id,
                status: 'confirmed',
                statusMessage: 'a été confirmée et payée'
              }
            });
            console.log('✅ Email de confirmation envoyé');
          } catch (emailError) {
            console.error('⚠️ Erreur envoi email:', emailError);
            // Ne pas faire échouer le webhook pour un problème d'email
          }
        }
      } else {
        console.warn('⚠️ Aucune commande trouvée pour la session:', session.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (err) {
    console.error('❌ Erreur webhook:', err);
    return new Response(`Webhook error: ${err.message}`, { status: 500 });
  }
});
