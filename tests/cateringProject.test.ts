import { expect, test } from 'bun:test';
import { cateringServices, formatCateringNeeds } from '../src/lib/cateringProject';
import { cateringQuoteSchema } from '../src/lib/cateringQuote';

test('selected services and particular needs are both preserved for storage and notification', () => {
  expect(formatCateringNeeds(['Buffets sur mesure', 'Show Sushi – Préparation en direct'], 'Sans gluten'))
    .toBe('Prestations souhaitées :\n• Buffets sur mesure\n• Show Sushi – Préparation en direct\n\nProjet :\nSans gluten');
});
test('all selected services and maximum project text fit the existing quote endpoint', () => {
  const needs = formatCateringNeeds([...cateringServices], 'a'.repeat(2000));
  expect(cateringQuoteSchema.safeParse({ audience: 'business', name: 'Test Projet', company: 'Entreprise', email: 'test@example.fr', phone: '0600000000', event_type: 'Séminaire', event_date: '2026-12-15', location: 'Avignon', guests: 40, needs, website: '' }).success).toBe(true);
  expect(needs.length).toBeLessThanOrEqual(3000);
});

const quote = { audience: 'private', name: 'Test Projet', company: '', email: 'test@example.fr', phone: '0600000000', event_type: 'Anniversaire', event_date: '2026-12-15', location: 'Avignon', guests: 50, needs: '', website: '' };
test('an explicitly undefined event date is accepted, but an empty or impossible date is rejected', () => {
  expect(cateringQuoteSchema.safeParse({ ...quote, event_date: null }).success).toBe(true);
  expect(cateringQuoteSchema.safeParse({ ...quote, event_date: '' }).success).toBe(false);
  expect(cateringQuoteSchema.safeParse({ ...quote, event_date: '2027-02-30' }).success).toBe(false);
});
test('guest count is required and must be a whole number', () => {
  expect(cateringQuoteSchema.safeParse({ ...quote, guests: '' }).success).toBe(false);
  expect(cateringQuoteSchema.safeParse({ ...quote, guests: undefined }).success).toBe(false);
  expect(cateringQuoteSchema.safeParse({ ...quote, guests: 50.5 }).success).toBe(false);
  expect(cateringQuoteSchema.safeParse({ ...quote, guests: '50' }).success).toBe(true);
});