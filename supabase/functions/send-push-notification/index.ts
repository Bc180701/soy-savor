import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer et valider les variables VAPID
    const vapidEmail = Deno.env.get('VAPID_CONTACT_EMAIL');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidEmail || !vapidPublicKey || !vapidPrivateKey) {
      throw new Error('Variables VAPID manquantes (VAPID_CONTACT_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)');
    }

    // Le subject doit être une URL mailto: ou https:
    const subject = vapidEmail.startsWith('mailto:') || vapidEmail.startsWith('https:') 
      ? vapidEmail 
      : `mailto:${vapidEmail}`;

    console.log('[Push] Configuration VAPID avec subject:', subject);

    // Configuration VAPID
    webpush.setVapidDetails(
      subject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Récupérer les données de la commande
    const { orderId, restaurantId } = await req.json();

    if (!orderId || !restaurantId) {
      throw new Error('orderId et restaurantId requis');
    }

    console.log(`[Push] Traitement commande ${orderId} pour restaurant ${restaurantId}`);

    // Créer client Supabase avec service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer les détails de la commande
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, client_name, restaurant_id, total')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande non trouvée');
    }

    // Récupérer le nom du restaurant
    const { data: restaurant } = await supabaseAdmin
      .from('restaurants')
      .select('name')
      .eq('id', restaurantId)
      .single();

    // Récupérer toutes les subscriptions pour ce restaurant
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('user_id, subscription_data')
      .eq('restaurant_id', restaurantId);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push] Aucune subscription pour ce restaurant');
      return new Response(
        JSON.stringify({ message: 'Aucune subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Push] ${subscriptions.length} subscriptions trouvées`);

    // DOUBLE VÉRIFICATION SÉCURITÉ : Confirmer que chaque user_id est admin ou super admin
    const validSubscriptions = [];
    for (const sub of subscriptions) {
      const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
        user_id: sub.user_id,
        role: 'administrateur'
      });

      const { data: isSuperAdmin } = await supabaseAdmin.rpc('has_role', {
        user_id: sub.user_id,
        role: 'super_administrateur'
      });

      if (isAdmin || isSuperAdmin) {
        validSubscriptions.push(sub);
      } else {
        console.warn(`[Push] User ${sub.user_id} n'est ni admin ni super admin, subscription ignorée`);
      }
    }

    console.log(`[Push] ${validSubscriptions.length} subscriptions valides après vérification admin`);

    if (validSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun admin abonné pour ce restaurant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Préparer le payload de notification
    const notificationPayload = JSON.stringify({
      title: '🔔 Nouvelle commande !',
      body: `Commande #${order.id.slice(0, 8)} - ${restaurant?.name || 'Restaurant'} - ${order.total.toFixed(2)}€`,
      icon: '/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png',
      badge: '/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png',
      data: {
        orderId: order.id,
        restaurantId: order.restaurant_id,
        url: '/admin'
      },
      requireInteraction: true,
      vibrate: [200, 100, 200],
      tag: `order-${order.id}`
    });

    console.log(`[Push] Envoi de ${validSubscriptions.length} notification(s) (tous endpoints y compris APNS iOS 16.4+)`);

    // Envoyer les notifications (y compris APNS via VAPID pour iOS 16.4+)
    const results = await Promise.allSettled(
      validSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            sub.subscription_data,
            notificationPayload
          );
          console.log(`[Push] ✅ Notification envoyée à ${sub.user_id}`);
          return { success: true, userId: sub.user_id };
        } catch (error: any) {
          console.error(`[Push] ❌ Erreur envoi à ${sub.user_id}:`, {
            message: error.message,
            statusCode: error.statusCode,
            body: error.body,
            headers: error.headers
          });
          
          // Si subscription expirée/invalide, la supprimer
          if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 400) {
            console.log(`[Push] Suppression subscription invalide/expirée pour ${sub.user_id} (code: ${error.statusCode})`);
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('user_id', sub.user_id)
              .eq('restaurant_id', restaurantId);
          }
          
          return { success: false, userId: sub.user_id, error: error.message, statusCode: error.statusCode };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    console.log(`[Push] ✅ ${successCount}/${validSubscriptions.length} notifications envoyées avec succès`);

    return new Response(
      JSON.stringify({ 
        message: `${successCount} notifications envoyées`,
        total: validSubscriptions.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Push] Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
