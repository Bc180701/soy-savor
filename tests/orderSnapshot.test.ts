import { describe, expect, test } from 'bun:test';
import { getOrderBackupItems, snapshotToPrintItems } from '../src/utils/orderSnapshot';

describe('separate orders from the same customer', () => {
  const firstId = '7ca8880f-7707-4a68-ae7f-e151ecedbc06';
  const secondId = '556f1d44-0b0d-4805-a83f-9d128f14e938';
  test('never selects the latest customer cart without an order link', () => {
    expect(getOrderBackupItems(firstId, [{ order_id: null, cart_items: ['Saumon tataki'] }])).toEqual([]);
  });
  test('does not select a backup linked to a second order', () => {
    expect(getOrderBackupItems(firstId, [{ order_id: secondId, cart_items: ['Saumon tataki'] }])).toEqual([]);
  });
  test('preserves the first order snapshot total and free extras', () => {
    const summary = [7.1, 7.2, 4.7, 7.5, 6.9, 13.9].map((price, i) => ({ name: `Article ${i}`, price, quantity: 1 }));
    summary.push({ name: 'Soja sucrée', price: 0, quantity: 2 });
    const items = snapshotToPrintItems(summary);
    expect(Math.round(items.reduce((total, item) => total + item.price * item.quantity, 0) * 100)).toBe(4730);
    expect(items.at(-1)).toMatchObject({ name: 'Soja sucrée', price: 0, quantity: 2 });
  });
});