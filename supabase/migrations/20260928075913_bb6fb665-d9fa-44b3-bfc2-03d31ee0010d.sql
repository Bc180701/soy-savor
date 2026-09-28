CREATE TABLE public.checkout_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  payload jsonb NOT NULL,
  stripe_session_id text,
  order_id uuid,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.checkout_drafts TO service_role;
ALTER TABLE public.checkout_drafts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_checkout_drafts_session ON public.checkout_drafts(stripe_session_id);