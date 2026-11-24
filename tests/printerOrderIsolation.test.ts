import { expect, mock, test } from 'bun:test';

const firstId = '7ca8880f-7707-4a68-ae7f-e151ecedbc06';
const secondId = '556f1d44-0b0d-4805-a83f-9d128f14e938';
const bookedSlots: Record<string, string> = {};
const snapshots: Record<string, any[]> = {
  [firstId]: [
    { name: 'CRISPY POULET TEMPURA AVOCAT SPICY', price: 7.1, quantity: 1 },
    { name: 'SPRING THON AVOCAT CONCOMBRE', price: 7.2, quantity: 1 },
    { name: 'NIGIRI SAUMON TATAKI', price: 4.7, quantity: 1 },
    { name: 'CALIFORNIA CÉSAR', price: 7.5, quantity: 1 },
    { name: 'CRISPY CREVETTE CONCOMBRE', price: 6.9, quantity: 1 },
    { name: 'POKÉ POULET TEMPURA', price: 13.9, quantity: 1 },
    { name: 'Soja sucrée', price: 0, quantity: 2 },
    { name: 'Wasabi', price: 0, quantity: 1 },
    { name: 'Gingembre', price: 0, quantity: 1 },
    { name: 'Baguettes', price: 0, quantity: 2 },
  ],
  [secondId]: [
    { name: 'Saumon tataki', price: 6.8, quantity: 1 },
    { name: 'Soja sucrée', price: 0.5, quantity: 1 },
  ],
};

mock.module('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: (_column: string, id: string) => ({
      single: async () => ({ data: { items_summary: snapshots[id], scheduled_for: bookedSlots[id] }, error: null }),
    }) }) }),
  },
}));

const { sendOrderToPrinter } = await import('../src/services/printerService');

test('manual printing uses the saved 11:45 French slot even when the device date differs', async () => {
  const id = 'saved-slot-order';
  snapshots[id] = [{ name: 'Sushi', price: 8.5, quantity: 1 }];
  bookedSlots[id] = '2026-11-24T11:45:00';
  const originalFetch = globalThis.fetch;
  let sent: any;
  globalThis.fetch = mock(async (_url: any, options: any) => {
    sent = JSON.parse(options.body);
    return new Response(JSON.stringify({ status: 'ok' }));
  }) as unknown as typeof fetch;
  try {
    const result = await sendOrderToPrinter({ id, scheduledFor: new Date('2026-11-24T20:45:00Z'), items: [] } as any);
    expect(result.success).toBe(true);
    expect(sent.scheduledFor).toBe('2026-11-24T10:45:00.000Z');
  } finally { globalThis.fetch = originalFetch; }
});

test('printer preserves creation composition in its payload', async () => {
  const id = 'creation-order';
  snapshots[id] = [{ name: 'Sushi Créa - Création 1', description: 'Base: Saumon; Sauce: Spicy; Topping: Sésame', price: 8.33, quantity: 1 }];
  const originalFetch = globalThis.fetch;
  let sent: any;
  globalThis.fetch = mock(async (_url: any, options: any) => {
    sent = JSON.parse(options.body);
    return new Response(JSON.stringify({ status: 'ok' }));
  }) as unknown as typeof fetch;
  try {
    const result = await sendOrderToPrinter({ id, scheduledFor: new Date('2026-11-03T19:00:00'), items: [] } as any);
    expect(result.success).toBe(true);
    expect(sent.items[0].description).toBe('Base: Saumon; Sauce: Spicy; Topping: Sésame');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('printer sends each order snapshot even when local cart belongs to the second purchase', async () => {
  const payloads: any[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock(async (_url: any, options: any) => {
    payloads.push(JSON.parse(options.body));
    return new Response(JSON.stringify({ status: 'ok' }));
  }) as unknown as typeof fetch;
  try {
    for (const id of [firstId, secondId]) {
      const result = await sendOrderToPrinter({
        id, scheduledFor: new Date('2026-11-03T12:00:00'),
        total: id === firstId ? 47.3 : 7.3,
        cartBackupItems: [{ menuItem: { name: 'Saumon tataki', price: 6.8 }, quantity: 1 }],
        itemsSummary: snapshots[secondId], items: [],
      } as any);
      expect(result.success).toBe(true);
    }
    expect(payloads[0].items).toHaveLength(10);
    expect(payloads[0].items.some((item: any) => item.name === 'Saumon tataki')).toBe(false);
    expect(Math.round(payloads[0].items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0) * 100)).toBe(4730);
    expect(payloads[1].items).toHaveLength(2);
    expect(Math.round(payloads[1].items.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0) * 100)).toBe(730);
  } finally {
    globalThis.fetch = originalFetch;
  }
});