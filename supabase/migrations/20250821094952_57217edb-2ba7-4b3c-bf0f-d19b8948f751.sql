-- Créer une table pour tracer les changements des settings de restaurants
CREATE TABLE IF NOT EXISTS public.restaurant_settings_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'BEFORE_UPDATE', 'AFTER_UPDATE', 'READ'
  settings_before JSONB,
  settings_after JSONB,
  triggered_by TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.restaurant_settings_audit ENABLE ROW LEVEL SECURITY;

-- Politique pour que les admins puissent tout voir
CREATE POLICY "Admins can view audit logs" 
ON public.restaurant_settings_audit 
FOR SELECT 
USING (has_role(auth.uid(), 'administrateur'::user_role));

-- Créer un trigger pour tracer tous les changements sur la table restaurants
CREATE OR REPLACE FUNCTION public.audit_restaurant_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Tracer les mises à jour
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.restaurant_settings_audit 
    (restaurant_id, action_type, settings_before, settings_after, triggered_by)
    VALUES 
    (NEW.id, 'UPDATE', OLD.settings, NEW.settings, 'TRIGGER_UPDATE');
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS audit_restaurant_settings_trigger ON public.restaurants;
CREATE TRIGGER audit_restaurant_settings_trigger
  AFTER UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_restaurant_settings();