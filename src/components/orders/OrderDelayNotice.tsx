import { getDelayMinutes } from '../../../supabase/functions/_shared/orderDelay';

export default function OrderDelayNotice({ notes, scheduled }: { notes?: string | null; scheduled: Date | string }) {
  const minutes = getDelayMinutes(notes);
  if (!minutes) return null;
  const date = new Date(scheduled);
  date.setMinutes(date.getMinutes() + minutes);
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return <p className="text-sm font-semibold text-destructive" role="status">
    Retard signalé : +{minutes} min · Nouvel horaire estimé : {time}
  </p>;
}