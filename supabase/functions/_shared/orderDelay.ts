// Delay is an estimate relative to the original booked slot, not a new booking.
export function getDelayMinutes(notes?: string | null): number {
  const matches = [...(notes || '').matchAll(/Retard de (\d+) min signalé/g)];
  return Number(matches.at(-1)?.[1] || 0);
}

export function delayedLocalTime(scheduled: string, minutes: number): string {
  const match = scheduled.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) throw new Error('Horaire de commande invalide');
  // Calendar arithmetic only: never interpret a Paris wall-clock timestamp as UTC.
  const [, y, m, d, h, min] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min) + minutes);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export function appendDelayNote(notes: string | null, reason: string, minutes: number, revised: string): string {
  return [notes, `${reason.trim()} (Retard de ${minutes} min signalé) — Nouvel horaire estimé: ${revised.slice(11, 16)}`]
    .filter(Boolean).join('\n');
}

export async function deliverAndSaveDelay(
  send: () => Promise<string>,
  save: () => Promise<void>,
): Promise<{ success: boolean; notificationSent: boolean; channel: string; error?: string }> {
  const channel = await send();
  try {
    await save();
    return { success: true, notificationSent: true, channel };
  } catch {
    return { success: false, notificationSent: true, channel,
      error: 'Alerte envoyée, mais le retard n’a pas pu être enregistré. Actualisez les commandes ; ne renvoyez pas l’alerte.' };
  }
}