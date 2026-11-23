import { expect, test } from 'bun:test';
import { readAutomaticPrintSetting, saveAutomaticPrintSetting } from '../src/services/automaticPrintSettings';

function database(initial = true) {
  let value = initial;
  const writes: any[] = [];
  const db = { from: (table: string) => {
    expect(table).toBe('automatic_print_settings');
    return {
      select: (columns: string) => {
        expect(columns).toBe('enabled');
        return { eq: (column: string, id: boolean) => {
          expect([column, id]).toEqual(['id', true]);
          return { single: async () => ({ data: { enabled: value }, error: null }) };
        } };
      },
      update: (payload: any) => {
        writes.push(payload);
        return { eq: (column: string, id: boolean) => {
          expect([column, id]).toEqual(['id', true]);
          value = payload.enabled;
          return { select: () => ({ single: async () => ({ data: { enabled: value }, error: null }) }) };
        } };
      },
    };
  } };
  return { db, writes };
}

test('one global setting disables and re-enables both restaurants, never writes a restaurant-specific value', async () => {
  const { db, writes } = database();
  expect(await readAutomaticPrintSetting(db)).toBe(true);
  expect(await saveAutomaticPrintSetting(db, false)).toBe(false);
  expect(await readAutomaticPrintSetting(db)).toBe(false);
  expect(await saveAutomaticPrintSetting(db, true)).toBe(true);
  expect(await readAutomaticPrintSetting(db)).toBe(true);
  expect(writes).toEqual([{ enabled: false }, { enabled: true }]);
});

test('a denied update must never report the switch as saved', async () => {
  const db = { from: () => ({ update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: { code: '42501' } }) }) }) }) }) };
  await expect(saveAutomaticPrintSetting(db, false)).rejects.toThrow('Impossible d’enregistrer');
});

test('an unreadable setting is not silently treated as disabled', async () => {
  const db = { from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }) };
  await expect(readAutomaticPrintSetting(db)).rejects.toThrow('Impossible de lire');
});