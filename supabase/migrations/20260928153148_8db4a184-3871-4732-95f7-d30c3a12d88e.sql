DROP POLICY IF EXISTS "Admins can delete own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Admins can insert own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Admins can view own subscriptions" ON public.push_subscriptions;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
CREATE POLICY "Admins select own subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_admin(auth.uid()));
CREATE POLICY "Admins insert own subscriptions" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_admin(auth.uid()));
CREATE POLICY "Admins update own subscriptions" ON public.push_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.is_admin(auth.uid()));
CREATE POLICY "Admins delete own subscriptions" ON public.push_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id AND public.is_admin(auth.uid()));