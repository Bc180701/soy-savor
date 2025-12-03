-- 1. Ajouter les nouvelles colonnes pour livraison/emporter et créneaux
ALTER TABLE public.special_events
ADD COLUMN IF NOT EXISTS delivery_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS pickup_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS time_slots jsonb DEFAULT '[]'::jsonb;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN public.special_events.delivery_enabled IS 'Indique si la livraison est disponible pour cet événement';
COMMENT ON COLUMN public.special_events.pickup_enabled IS 'Indique si le retrait en magasin est disponible pour cet événement';
COMMENT ON COLUMN public.special_events.time_slots IS 'Créneaux horaires spécifiques pour cet événement, format: [{"time": "11:00", "max_orders": 5}, ...]';

-- 2. Mettre à jour les policies RLS pour inclure super_administrateur
DROP POLICY IF EXISTS "Admins can insert special events" ON public.special_events;
DROP POLICY IF EXISTS "Admins can update special events" ON public.special_events;
DROP POLICY IF EXISTS "Admins can delete special events" ON public.special_events;

CREATE POLICY "Admins can insert special events" ON public.special_events
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'administrateur'::user_role) OR 
  has_role(auth.uid(), 'super_administrateur'::user_role)
);

CREATE POLICY "Admins can update special events" ON public.special_events
FOR UPDATE USING (
  has_role(auth.uid(), 'administrateur'::user_role) OR 
  has_role(auth.uid(), 'super_administrateur'::user_role)
);

CREATE POLICY "Admins can delete special events" ON public.special_events
FOR DELETE USING (
  has_role(auth.uid(), 'administrateur'::user_role) OR 
  has_role(auth.uid(), 'super_administrateur'::user_role)
);