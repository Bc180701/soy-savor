-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Admins can update special events" ON public.special_events;

-- Recreate the UPDATE policy without WITH CHECK restriction
-- This allows admins to update any field including is_active to false
CREATE POLICY "Admins can update special events" 
ON public.special_events 
FOR UPDATE 
USING (has_role(auth.uid(), 'administrateur'::user_role) OR has_role(auth.uid(), 'super_administrateur'::user_role));