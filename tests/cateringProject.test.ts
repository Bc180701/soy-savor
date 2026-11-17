import { expect, test } from 'bun:test';
import { cateringServices, formatCateringNeeds } from '../src/lib/cateringProject';
import { cateringQuoteSchema } from '../src/lib/cateringQuote';

test('selected services and particular needs are both preserved for storage and notification', () => {
  expect(formatCateringNeeds(['Buffets gastronomiques', 'Scénographie & art de la table'], 'Sans gluten'))
    .toBe('Prestations souhaitées :\n• Buffets gastronomiques\n• Scénographie & art de la table\n\nProjet :\nSans gluten');
});
test('all seven services and maximum project text fit the existing quote endpoint', () => {
  const needs = formatCateringNeeds([...cateringServices], 'a'.repeat(2000));
  expect(cateringQuoteSchema.safeParse({ audience: 'business', name: 'Test Projet', company: 'Entreprise', email: 'test@example.fr', phone: '0600000000', event_type: 'Séminaire', event_date: '2026-12-15', location: 'Avignon', guests: 40, needs, website: '' }).success).toBe(true);
  expect(needs.length).toBeLessThanOrEqual(3000);
});