
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cart_backup ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow cart backup read for recovery" ON public.cart_backup;
DROP POLICY IF EXISTS "Allow cart backup update" ON public.cart_backup;
CREATE POLICY "Admins can view cart backups"
  ON public.cart_backup FOR SELECT
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update cart backups"
  ON public.cart_backup FOR UPDATE
  USING (public.is_admin(auth.uid()));

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage push tokens"
  ON public.push_tokens FOR ALL
  USING (auth.uid()::text = user_id AND public.is_admin(auth.uid()))
  WITH CHECK (auth.uid()::text = user_id AND public.is_admin(auth.uid()));

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_time_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can manage delivery zones"
  ON public.delivery_zones FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON public.products;
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_admin(auth.uid()));
