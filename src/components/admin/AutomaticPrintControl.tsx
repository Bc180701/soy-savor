import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Printer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { readAutomaticPrintSetting, saveAutomaticPrintSetting } from '@/services/automaticPrintSettings';

export default function AutomaticPrintControl() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      setEnabled(await readAutomaticPrintSetting(supabase));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Réglage indisponible.');
    } finally { busy.current = false; setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const onFocus = () => { void load(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const change = async (value: boolean) => {
    if (busy.current || enabled === null) return;
    busy.current = true;
    setSaving(true);
    try {
      setEnabled(await saveAutomaticPrintSetting(supabase, value));
      setError('');
      toast({ title: value ? 'Impression automatique activée' : 'Impression automatique désactivée', description: 'Châteaurenard et Saint-Martin-de-Crau' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.');
    } finally { busy.current = false; setSaving(false); }
  };

  return (
    <section aria-label="Impression automatique" className="border-b border-border pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor="automatic-print-global" className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Printer className="h-5 w-5 shrink-0" /> Impression automatique
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">Châteaurenard et Saint-Martin-de-Crau</p>
          <p aria-live="polite" className="mt-2 text-sm font-medium text-foreground">
            {saving ? 'Enregistrement…' : loading ? 'Chargement…' : error ? 'Réglage à vérifier' : enabled ? 'Activée pour les deux restaurants' : 'Désactivée pour les deux restaurants'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {(loading || saving) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          <Switch id="automatic-print-global" checked={enabled === true} disabled={loading || saving || enabled === null || !!error} onCheckedChange={change} />
          <Button variant="ghost" size="icon" title="Actualiser le réglage" aria-label="Actualiser le réglage" onClick={() => { void load(); }} disabled={loading || saving}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}