import { supabase } from '@/integrations/supabase/client';

/** Only retrieve details from this order's payment, never the customer's latest cart. */
export async function loadOrderPurchaseSnapshot(orderId: string, summary: any[]): Promise<any[]> {
  let items = summary;
  if (items.some(item => item && typeof item === 'object' && 'n' in item)) {
    const { data, error } = await supabase.rpc('decode_items_summary', { encoded_summary: items });
    if (error || !Array.isArray(data)) throw new Error('Impossible de lire les articles de cette commande.');
    items = data;
  }
  if (items.some(item => /cr[ée]a/i.test(item.name || '') && !item.description)) {
    const { data, error } = await supabase.functions.invoke('order-purchase-snapshot', { body: { orderId } });
    if (!error && Array.isArray(data?.items)) items = data.items;
    else console.warn('Compositions non récupérées pour cette commande:', orderId);
  }
  return items;
}