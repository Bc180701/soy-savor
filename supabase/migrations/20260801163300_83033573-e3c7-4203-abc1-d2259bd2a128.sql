DROP POLICY IF EXISTS "Enable all access for admin users" ON public.blocked_time_slots;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_time_slots TO authenticated;
GRANT SELECT ON public.blocked_time_slots TO anon;
GRANT ALL ON public.blocked_time_slots TO service_role;

CREATE POLICY "Admins can manage blocked time slots"
ON public.blocked_time_slots
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view blocked time slots"
ON public.blocked_time_slots
FOR SELECT
TO anon, authenticated
USING (true);