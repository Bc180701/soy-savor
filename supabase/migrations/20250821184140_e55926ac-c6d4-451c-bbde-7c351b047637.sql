-- Corriger les politiques RLS pour blocked_time_slots
-- D'abord, supprimer la politique existante qui ne fonctionne pas
DROP POLICY IF EXISTS "Admins can manage blocked time slots" ON public.blocked_time_slots;

-- Créer une nouvelle politique plus simple pour les administrateurs
CREATE POLICY "Enable all access for admin users" 
ON public.blocked_time_slots 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrateur'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrateur'::user_role
  )
);