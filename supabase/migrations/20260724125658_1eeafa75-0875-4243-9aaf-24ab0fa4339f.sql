ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS required_options jsonb NOT NULL DEFAULT '[]'::jsonb;