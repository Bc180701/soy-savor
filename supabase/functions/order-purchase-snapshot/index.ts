import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { z } from 'npm:zod@3';
import { enrichPurchaseSnapshot, stripeLinesToSnapshot } from '../_shared/purchaseSnapshot.ts';

// Read-only recovery from the exact payment session, restricted to administrators.
Deno.serve(async req => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Unauthorized' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
  const { data: auth, error: authError } = await client.auth.getUser(authorization.slice(7));
  if (authError || !auth.user) return respond({ error: 'Unauthorized' }, 401);
  const { data: admin, error: roleError } = await client.rpc('is_admin', { user_id: auth.user.id });
  if (roleError || !admin) return respond({ error: 'Forbidden' }, 403);
  try {
    const parsed = z.object({ orderId: z.string().uuid() }).safeParse(await req.json());
    if (!parsed.success) return respond({ error: 'Invalid order ID' }, 400);
    const { data: order, error } = await client.from('orders')
      .select('items_summary, stripe_session_id, restaurant_id').eq('id', parsed.data.orderId).single();
    if (error || !order) return respond({ error: 'Order not found' }, 404);
    const summary = Array.isArray(order.items_summary) ? order.items_summary : [];
    if (!order.stripe_session_id || !summary.some(item => /cr[ée]a/i.test(item.name || '') && !item.description)) {
      return respond({ items: summary });
    }
    // Use the restaurant's existing Stripe configuration only on the server.
    const { data: restaurant } = await client.from('restaurants').select('settings').eq('id', order.restaurant_id).single();
    const key = restaurant?.settings?.stripe_secret_key;
    if (!key) return respond({ error: 'Payment configuration unavailable' }, 503);
    const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
    const lines: any[] = [];
    let after: string | undefined;
    let more = true;
    while (more) {
      const page = await stripe.checkout.sessions.listLineItems(order.stripe_session_id, {
        limit: 100, expand: ['data.price.product'], ...(after ? { starting_after: after } : {}),
      });
      lines.push(...page.data);
      more = page.has_more && page.data.length > 0;
      after = page.data.at(-1)?.id;
    }
    return respond({ items: enrichPurchaseSnapshot(summary, stripeLinesToSnapshot(lines)) });
  } catch {
    return respond({ error: 'Unable to retrieve purchase details' }, 502);
  }
});