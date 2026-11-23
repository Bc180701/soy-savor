import { assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { automaticPrintPayload, dispatchAutomaticPrint, scheduleAutomaticPrint } from '../_shared/automaticPrint.ts';

const order = {
  id: 'auto-test', restaurant_id: '11111111-1111-1111-1111-111111111111',
  payment_status: 'paid', stripe_session_id: 'cs_test', auto_print_eligible: true,
  scheduled_for: '2026-11-23T12:00:00', order_type: 'delivery',
  client_name: 'Test', client_phone: '0600000000', client_email: 'test@example.invalid',
  delivery_street: '1 rue du Test', delivery_city: 'Châteaurenard', delivery_postal_code: '13160',
  subtotal: 8.5, tax: 0.85, total: 8.5,
  items_summary: [
    { name: 'Sushi Créa', description: 'Base: Saumon; Sauce: Spicy; Topping: Sésame', quantity: 1, unit_price: 8.5 },
    { name: 'Soja sucrée', quantity: 2, unit_price: 0 },
    { name: 'Baguettes', quantity: 2, price: 0 },
  ],
};

function database(input: any = order) {
  let claimed = false;
  const updates: any[] = [];
  return {
    updates,
    rpc: (name: string, args: any) => {
      assertEquals(name, 'claim_automatic_print');
      assertEquals(args.p_order_id, input.id);
      if (claimed || !input.auto_print_eligible || input.payment_status !== 'paid' || !input.stripe_session_id || !input.items_summary.length) {
        return Promise.resolve({ data: null, error: null });
      }
      claimed = true;
      return Promise.resolve({ data: structuredClone(input), error: null });
    },
    from: (name: string) => {
      assertEquals(name, 'automatic_print_jobs');
      return { update: (value: any) => ({ eq: (key: string, id: string) => {
        assertEquals(key, 'order_id'); assertEquals(id, input.id);
        updates.push(value); return Promise.resolve({ error: null });
      } }) };
    },
  };
}

Deno.test('both simultaneous confirmation paths send exactly one automatic ticket', async () => {
  const db = database(); let sends = 0;
  const send = (async () => { sends++; return new Response('{"status":"ok"}'); }) as typeof fetch;
  await Promise.all([dispatchAutomaticPrint(db, order.id, send), dispatchAutomaticPrint(db, order.id, send)]);
  await dispatchAutomaticPrint(db, order.id, send);
  assertEquals(sends, 1); assertEquals(db.updates, [{ status: 'accepted', error_code: null }]);
});

Deno.test('ticket retains every composition, free sauce and utensil with raw booked time', () => {
  const payload = automaticPrintPayload(order, order.items_summary);
  assertEquals(payload.items.length, 3);
  assertEquals(payload.items[0].description, 'Base: Saumon; Sauce: Spicy; Topping: Sésame');
  assertEquals(payload.items[1], { name: 'Soja sucrée', quantity: 2, price: 0, description: '', specialInstructions: '' });
  assertEquals(payload.items[2].quantity, 2);
  assertEquals(payload.scheduledFor, '2026-11-23T12:00:00');
  assertEquals(payload.deliveryPostalCode, '13160');
  assertEquals(payload.restaurant_id, '11111111-1111-1111-1111-111111111111');
});

Deno.test('large paid snapshot is not truncated to Stripe metadata length', () => {
  const items = Array.from({ length: 120 }, (_, i) => ({ name: `Création ${i + 1}`, description: 'Sauce: Spicy; Topping: Sésame'.repeat(25), quantity: 1, price: 8.5 }));
  const payload = automaticPrintPayload(order, items);
  assertEquals(payload.items.length, 120);
  assertEquals(payload.items[119].description, items[119].description);
});

Deno.test('Saint-Martin orders retain the Saint-Martin printer destination', () => {
  const payload = automaticPrintPayload({ ...order, restaurant_id: '22222222-2222-2222-2222-222222222222' }, order.items_summary);
  assertEquals(payload.restaurant_id, '22222222-2222-2222-2222-222222222222');
});

Deno.test('free unit prices are not replaced with a nonzero fallback price', () => {
  const payload = automaticPrintPayload(order, [{ name: 'Création offerte', unit_price: 0, price: 8.5, quantity: 1 }]);
  assertEquals(payload.items[0].price, 0);
});

for (const [label, change] of [
  ['unpaid', { payment_status: 'pending' }], ['historical', { auto_print_eligible: false }],
  ['without a Stripe payment', { stripe_session_id: null }], ['empty', { items_summary: [] }],
] as const) {
  Deno.test(`${label} order does not send an automatic ticket`, async () => {
    let sends = 0; const db = database({ ...order, ...change });
    await dispatchAutomaticPrint(db, order.id, (async () => { sends++; return new Response('{}'); }) as typeof fetch);
    assertEquals(sends, 0); assertEquals(db.updates, []);
  });
}

Deno.test('printer outage never rejects payment and ambiguous sends are not retried', async () => {
  const db = database(); let sends = 0;
  const send = (async () => { sends++; throw new Error('timeout'); }) as typeof fetch;
  await dispatchAutomaticPrint(db, order.id, send);
  await dispatchAutomaticPrint(db, order.id, send);
  assertEquals(sends, 1); assertEquals(db.updates, [{ status: 'uncertain', error_code: 'timeout' }]);
});

Deno.test('OVH must explicitly accept the request before marking accepted', async () => {
  const db = database();
  await dispatchAutomaticPrint(db, order.id, (async () => new Response('{"status":"error"}')) as typeof fetch);
  assertEquals(db.updates, [{ status: 'uncertain', error_code: 'printer_rejected' }]);
});

Deno.test('unsupported restaurant never falls back to another kitchen', async () => {
  const db = database({ ...order, restaurant_id: 'unknown' }); let sends = 0;
  await dispatchAutomaticPrint(db, order.id, (async () => { sends++; return new Response('{}'); }) as typeof fetch);
  assertEquals(sends, 0); assertEquals(db.updates, [{ status: 'failed', error_code: 'unsupported_restaurant' }]);
});

Deno.test('background printing is registered without waiting for payment response', async () => {
  let task: Promise<unknown> | undefined;
  const runtime = globalThis as typeof globalThis & { EdgeRuntime?: { waitUntil: (task: Promise<unknown>) => void } };
  const original = runtime.EdgeRuntime;
  runtime.EdgeRuntime = { waitUntil: promise => { task = promise; } };
  try {
    await scheduleAutomaticPrint(database({ ...order, auto_print_eligible: false }), order.id);
    assertEquals(task instanceof Promise, true);
    await task;
  } finally { runtime.EdgeRuntime = original; }
});

Deno.test('empty snapshots are never turned into a blank printed order', () => {
  assertThrows(() => automaticPrintPayload(order, []), Error, 'empty_snapshot');
});