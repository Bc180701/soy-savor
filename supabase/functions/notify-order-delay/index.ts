import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { Resend } from 'npm:resend@2.0.0';
import { z } from 'npm:zod@3';
import { appendDelayNote, delayedLocalTime, deliverAndSaveDelay } from '../_shared/orderDelay.ts';

Deno.serve(async req => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Connexion requise' }, 401);
    const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authorization } },
    });
    const { data: auth, error: authError } = await client.auth.getUser(authorization.slice(7));
    if (authError || !auth.user) return respond({ error: 'Session expirée, reconnectez-vous' }, 401);
    const { data: admin } = await client.rpc('is_admin', { user_id: auth.user.id });
    const { data: kitchen } = await client.rpc('has_role', { user_id: auth.user.id, role: 'cuisinier' });
    if (!admin && !kitchen) return respond({ error: 'Accès refusé' }, 403);
    const parsed = z.object({ orderId: z.string().uuid(), delayMinutes: z.number().int().min(5).max(1440), delayReason: z.string().trim().min(1).max(1000) }).safeParse(await req.json());
    if (!parsed.success) return respond({ error: 'Commande, durée et raison du retard requis' }, 400);
    const { orderId, delayMinutes, delayReason } = parsed.data;
    const { data: order, error: readError } = await client.from('orders')
      .select('id, client_email, client_phone, client_name, order_type, scheduled_for, customer_notes')
      .eq('id', orderId).single();
    if (readError || !order) return respond({ error: 'Commande introuvable' }, 404);
    const revised = delayedLocalTime(order.scheduled_for, delayMinutes);
    const label = order.order_type === 'delivery' ? 'Livraison' : 'Retrait';
    const message = `SUSHIEATS : retard de ${delayMinutes} min pour votre commande #${orderId.slice(0, 8)}. ${label} estimé à ${revised.slice(11, 16)}. ${delayReason}. Merci de votre compréhension.`;
    const result = await deliverAndSaveDelay(async () => {
      if (order.client_email) {
        const key = Deno.env.get('RESEND_API_KEY');
        if (!key) throw new Error('Envoi email non configuré');
        const response = await new Resend(key).emails.send({
          from: 'SUSHIEATS <confirmation@email.contact.sushieats.fr>',
          to: [order.client_email],
          subject: `Retard pour votre commande #${orderId.slice(0, 8)}`,
          text: `Bonjour ${order.client_name || 'Client'},\n\n${message}`,
        });
        if (response.error || !response.data?.id) {
          console.error('Delay email refused', { orderId, providerError: response.error?.name });
          throw new Error('Le service email a refusé l’alerte. Aucun retard enregistré.');
        }
        console.log('Delay email accepted', { orderId, messageId: response.data.id });
        return 'email';
      }
      if (!order.client_phone) throw new Error('Aucun email ni téléphone sur cette commande');
      const { data, error } = await client.functions.invoke('send-sms-notification', { body: { orderId, phoneNumber: order.client_phone, message } });
      if (error || !data?.success || !data?.messageId) throw new Error('Le service SMS a refusé l’alerte. Aucun retard enregistré.');
      return 'sms';
    }, async () => {
      const { data: latest, error: latestError } = await client.from('orders').select('customer_notes').eq('id', orderId).single();
      if (latestError || !latest) throw new Error('Lecture du retard impossible');
      const customerNotes = appendDelayNote(latest.customer_notes, delayReason, delayMinutes, revised);
      let update = client.from('orders').update({ customer_notes: customerNotes }).eq('id', orderId);
      update = latest.customer_notes === null ? update.is('customer_notes', null) : update.eq('customer_notes', latest.customer_notes);
      const { data: saved, error } = await update.select('id, customer_notes').single();
      if (error || !saved) throw new Error('Retard non enregistré');
    });
    if (!result.success) return respond(result, 200);
    const { data: saved, error: savedError } = await client.from('orders').select('customer_notes').eq('id', orderId).single();
    if (savedError || !saved) return respond({ success: false, notificationSent: true, error: 'Alerte envoyée, mais impossible de relire le retard. Actualisez les commandes.' });
    return respond({ ...result, customerNotes: saved.customer_notes, revisedTime: revised });
  } catch (error) {
    console.error('Delay notification failed', error instanceof Error ? error.message : 'Unknown error');
    return respond({ success: false, error: error instanceof Error ? error.message : 'Envoi du retard impossible' }, 500);
  }
});
