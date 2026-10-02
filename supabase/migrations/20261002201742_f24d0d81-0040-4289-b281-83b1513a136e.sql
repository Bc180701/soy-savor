CREATE TABLE public.checkout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  restaurant_id uuid,
  client_email text,
  order_type text,
  scheduled_for text,
  outcome text NOT NULL,
  details text,
  duration_ms integer,
  user_agent text
);
GRANT INSERT ON public.checkout_attempts TO anon, authenticated;
GRANT SELECT ON public.checkout_attempts TO authenticated;
GRANT ALL ON public.checkout_attempts TO service_role;
ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log checkout attempts" ON public.checkout_attempts
  FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(outcome) <= 50 AND coalesce(char_length(details),0) <= 1000 AND coalesce(char_length(user_agent),0) <= 500);
CREATE POLICY "Admins can read checkout attempts" ON public.checkout_attempts
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX checkout_attempts_created_at_idx ON public.checkout_attempts (created_at DESC);