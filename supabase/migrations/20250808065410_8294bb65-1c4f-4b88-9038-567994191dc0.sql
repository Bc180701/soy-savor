-- Add flags to hide extras from menus while allowing insertion as real products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_extra boolean NOT NULL DEFAULT false;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_is_hidden ON public.products (is_hidden);
CREATE INDEX IF NOT EXISTS idx_products_is_extra ON public.products (is_extra);
