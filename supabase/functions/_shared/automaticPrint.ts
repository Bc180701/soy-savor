/** Same OVH payload as manual printing; automatic dispatch never uses a customer cart. */
const PRINT_URL = 'https://sushieats.fr/add-order.php';
const RESTAURANTS = new Set([
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
]);

export function automaticPrintPayload(order: any, summary: any[]) {
  if (!RESTAURANTS.has(order.restaurant_id)) throw new Error('unsupported_restaurant');
  if (!summary.length) throw new Error('empty_snapshot');
  const items = summary.map(item => {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) throw new Error('invalid_snapshot');
    const quantity = Number(item.quantity ?? 1);
    const price = Number(item.unit_price ?? item.price ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) throw new Error('invalid_snapshot');
    return {
      name: item.name, quantity, price,
      description: item.description || '',
      specialInstructions: item.special_instructions || '',
    };
  });
  return {
    id: order.id, restaurant_id: order.restaurant_id,
    clientName: order.client_name || 'Client', clientPhone: order.client_phone || '',
    clientEmail: order.client_email || '', orderType: order.order_type,
    // Preserve the booked French local value: no UTC conversion.
    scheduledFor: order.scheduled_for, items,
    subtotal: Number(order.subtotal), tax: Number(order.tax),
    deliveryFee: Number(order.delivery_fee || 0), tip: Number(order.tip || 0),
    discount: Number(order.discount || 0), total: Number(order.total),
    deliveryInstructions: order.delivery_instructions, customerNotes: order.customer_notes,
    allergies: order.allergies, deliveryStreet: order.delivery_street,
    deliveryCity: order.delivery_city, deliveryPostalCode: order.delivery_postal_code,
  };
}

/** Atomic order-ID claim is shared by webhook and verify-payment, including concurrent calls. */
export async function dispatchAutomaticPrint(db: any, orderId: string, send: typeof fetch = fetch): Promise<void> {
  let claimed = false;
  let requestStarted = false;
  try {
    const { data: order, error } = await db.rpc('claim_automatic_print', { p_order_id: orderId });
    if (error) throw new Error('claim_failed');
    if (!order) return;
    claimed = true;
    let summary = order.items_summary;
    if (summary.some((item: any) => item && typeof item === 'object' && 'n' in item)) {
      const decoded = await db.rpc('decode_items_summary', { encoded_summary: summary });
      if (decoded.error || !Array.isArray(decoded.data)) throw new Error('decode_failed');
      summary = decoded.data;
    }
    const payload = automaticPrintPayload(order, summary);
    requestStarted = true;
    const response = await send(PRINT_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('printer_http_error');
    const result = await response.json();
    if (result?.status !== 'ok') throw new Error('printer_rejected');
    const saved = await db.from('automatic_print_jobs')
      .update({ status: 'accepted', error_code: null }).eq('order_id', orderId);
    if (saved.error) throw new Error('persistence_failed');
    console.log('Automatic print accepted by OVH:', orderId);
  } catch (error) {
    // Never fail a paid order; never blindly retry an HTTP request that might have reached OVH.
    const code = error instanceof Error ? error.message : 'print_failed';
    if (claimed) {
      try {
        const saved = await db.from('automatic_print_jobs').update({
          status: requestStarted ? 'uncertain' : 'failed', error_code: code,
        }).eq('order_id', orderId);
        if (saved.error) console.error('Automatic print tracking failed:', orderId);
      } catch { console.error('Automatic print tracking unavailable:', orderId); }
    }
    console.error('Automatic print not confirmed:', orderId, code);
  }
}

/** Supabase keeps the task alive after responding, even if the customer closes the page. */
export async function scheduleAutomaticPrint(db: any, orderId: string): Promise<void> {
  const task = dispatchAutomaticPrint(db, orderId);
  const runtime = (globalThis as typeof globalThis & {
    EdgeRuntime?: { waitUntil: (task: Promise<unknown>) => void };
  }).EdgeRuntime;
  if (runtime) runtime.waitUntil(task);
  else await task;
}