CREATE TABLE public.catering_quote_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 audience text NOT NULL,
 name text NOT NULL,
 email text NOT NULL,
 phone text NOT NULL,
 company text NOT NULL DEFAULT '',
 event_type text NOT NULL,
 event_date date NOT NULL,
 location text NOT NULL,
 guests integer NOT NULL,
 needs text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 notification_status text NOT NULL DEFAULT 'pending',
 notification_id text,
 notification_error text
);
GRANT SELECT ON public.catering_quote_requests TO authenticated;
GRANT ALL ON public.catering_quote_requests TO service_role;
ALTER TABLE public.catering_quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read catering requests" ON public.catering_quote_requests FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE INDEX catering_quote_requests_created_at_idx ON public.catering_quote_requests(created_at DESC);
CREATE INDEX catering_quote_requests_email_created_idx ON public.catering_quote_requests(email, created_at DESC);