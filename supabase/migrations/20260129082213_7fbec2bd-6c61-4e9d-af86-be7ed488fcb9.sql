-- Fix SELECT policy so super admins can also see (and therefore update/return) inactive events
DROP POLICY IF EXISTS "Anyone can view active special events" ON public.special_events;

CREATE POLICY "Anyone can view active special events"
ON public.special_events
FOR SELECT
USING (
  is_active = true
  OR public.is_admin(auth.uid())
);