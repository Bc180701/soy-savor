-- Add items_summary column to store raw items from Stripe webhook
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS items_summary JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.orders.items_summary IS 'Résumé brut des articles (Stripe metadata.items_summary) stocké en JSONB.';