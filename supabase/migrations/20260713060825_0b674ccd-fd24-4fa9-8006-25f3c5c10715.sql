
-- Fix orders SELECT/UPDATE policies to accept super_administrateur too
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;

CREATE POLICY "Users and admins can view orders" ON public.orders
FOR SELECT USING (
  auth.uid() = user_id
  OR public.is_admin(auth.uid())
  OR has_role(auth.uid(), 'cuisinier'::user_role)
  OR has_role(auth.uid(), 'livreur'::user_role)
);

CREATE POLICY "Staff can update orders" ON public.orders
FOR UPDATE USING (
  public.is_admin(auth.uid())
  OR has_role(auth.uid(), 'cuisinier'::user_role)
  OR has_role(auth.uid(), 'livreur'::user_role)
);

-- Fix order_items SELECT policies
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users and admins can view order items" ON public.order_items;

CREATE POLICY "Users and admins can view order items" ON public.order_items
FOR SELECT USING (
  public.is_admin(auth.uid())
  OR has_role(auth.uid(), 'cuisinier'::user_role)
  OR has_role(auth.uid(), 'livreur'::user_role)
  OR EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Fix user_roles SELECT so admins list works for super_admin too
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

CREATE POLICY "Admins can view all user roles" ON public.user_roles
FOR SELECT USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can delete user roles" ON public.user_roles
FOR DELETE USING (public.is_admin(auth.uid()));
