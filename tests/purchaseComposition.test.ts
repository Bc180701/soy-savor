import { expect, test } from 'bun:test';
import { enrichPurchaseSnapshot, stripeLinesToSnapshot } from '../supabase/functions/_shared/purchaseSnapshot';

test('recovers the exact creation composition without replacing paid amounts or adding another purchase', () => {
  const summary = [{ id: 'prod_first', name: 'Sushi Créa wmw-0 - Création 1', price: 8.33, quantity: 1 }];
  const items = enrichPurchaseSnapshot(summary, [
    { ...summary[0], description: 'Base: Saumon; Garnitures: Avocat; Sauce: Spicy', price: 20, quantity: 3 },
    { id: 'prod_second', name: 'Sushi Créa autre commande', description: 'Base: Thon' },
  ]);
  expect(items).toHaveLength(1);
  expect(items[0]).toEqual({ ...summary[0], description: 'Base: Saumon; Garnitures: Avocat; Sauce: Spicy' });
});

test('does not guess a composition when payment product identity differs', () => {
  const summary = [{ id: 'prod_first', name: 'Poké Créa', price: 16.9, quantity: 1 }];
  expect(enrichPurchaseSnapshot(summary, [{ id: 'prod_second', name: 'Poké Créa', description: 'Other creation' }])).toEqual(summary);
});

test('Stripe snapshot retains creation description and unit price for multiple quantities', () => {
  const items = stripeLinesToSnapshot([{ description: 'Sushi Créa', amount_total: 2500, quantity: 3,
    price: { unit_amount: 833, product: { id: 'prod_first', description: 'Enrobage: Avocado; Topping: Sésame' } } }]);
  expect(items[0]).toMatchObject({ description: 'Enrobage: Avocado; Topping: Sésame', price: 8.33, quantity: 3 });
});