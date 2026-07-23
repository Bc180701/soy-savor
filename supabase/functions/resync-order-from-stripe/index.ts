import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, stripe_session_id, restaurant_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found', details: orderErr?.message }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!order.stripe_session_id) {
      return new Response(JSON.stringify({ error: 'No stripe_session_id on order' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get restaurant-specific Stripe key
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('settings')
      .eq('id', order.restaurant_id)
      .single();

    const stripeKey = (restaurant?.settings as any)?.stripe_secret_key || Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'No Stripe key' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Paginate all line items
    const allLineItems: any[] = [];
    let startingAfter: string | undefined;
    let hasMore = true;
    while (hasMore) {
      const params: any = { limit: 100, expand: ['data.price.product'] };
      if (startingAfter) params.starting_after = startingAfter;
      const page = await stripe.checkout.sessions.listLineItems(order.stripe_session_id, params);
      if (page.data?.length) {
        allLineItems.push(...page.data);
        startingAfter = page.data[page.data.length - 1].id;
      }
      hasMore = !!page.has_more;
    }

    const itemsSummary = allLineItems.map((item: any) => ({
      id: item.price?.product?.metadata?.product_id || item.price?.product?.id || 'unknown',
      name: item.description || item.price?.product?.name || 'Produit inconnu',
      price: (item.amount_total || 0) / 100,
      quantity: item.quantity || 1,
      unit_price: (item.price?.unit_amount || 0) / 100
    }));

    // Update items_summary
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ items_summary: itemsSummary })
      .eq('id', orderId);
    if (updateErr) throw updateErr;

    // NOTE: order_items requires product_id NOT NULL. items_summary is the source of truth
    // for historical orders (printing, admin), so we only update items_summary here.

    return new Response(JSON.stringify({
      success: true,
      orderId,
      items_count: itemsSummary.length,
      items: itemsSummary
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
