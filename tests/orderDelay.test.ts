import { expect, test } from 'bun:test';
import { appendDelayNote, delayedLocalTime, deliverAndSaveDelay, getDelayMinutes } from '../supabase/functions/_shared/orderDelay';

test('a 15 minute delay shows the revised pickup/delivery time without moving the booking', () => {
  const original = '2026-11-09T19:45:00';
  expect(delayedLocalTime(original, 15)).toBe('2026-11-09T20:00:00');
  expect(original).toBe('2026-11-09T19:45:00');
});
test('delay preserves customer notes and uses the latest estimate', () => {
  const notes = appendDelayNote('Sans sésame', 'Affluence', 15, '2026-11-09T20:00:00');
  expect(notes.startsWith('Sans sésame\n')).toBe(true);
  expect(getDelayMinutes(appendDelayNote(notes, 'Circulation', 20, '2026-11-09T20:05:00'))).toBe(20);
});
test('failed delivery never saves a delay or reports success', async () => {
  let saved = false;
  await expect(deliverAndSaveDelay(async () => { throw new Error('Provider refused'); }, async () => { saved = true; })).rejects.toThrow('Provider refused');
  expect(saved).toBe(false);
});
test('failed persistence explicitly reports that an alert was sent but not saved', async () => {
  expect(await deliverAndSaveDelay(async () => 'email', async () => { throw new Error('RLS'); }))
    .toMatchObject({ success: false, notificationSent: true, channel: 'email' });
});
test('success requires both notification acceptance and persistence', async () => {
  let saved = false;
  const result = await deliverAndSaveDelay(async () => 'sms', async () => { saved = true; });
  expect(saved).toBe(true);
  expect(result).toEqual({ success: true, notificationSent: true, channel: 'sms' });
});