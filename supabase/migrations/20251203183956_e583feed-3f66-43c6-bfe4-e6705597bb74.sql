-- Fix the UPDATE policy for special_events to include WITH CHECK clause
DROP POLICY IF EXISTS "Admins can update special events" ON public.special_events;

CREATE POLICY "Admins can update special events" 
ON public.special_events 
FOR UPDATE 
USING (has_role(auth.uid(), 'administrateur'::user_role) OR has_role(auth.uid(), 'super_administrateur'::user_role))
WITH CHECK (has_role(auth.uid(), 'administrateur'::user_role) OR has_role(auth.uid(), 'super_administrateur'::user_role));