-- Drop existing policies that rely on subqueries to user_roles
DROP POLICY IF EXISTS "Admins can view all promo codes" ON public.promotion_codes;
DROP POLICY IF EXISTS "Admins can create promo codes" ON public.promotion_codes;
DROP POLICY IF EXISTS "Admins can update promo codes" ON public.promotion_codes;
DROP POLICY IF EXISTS "Admins can delete promo codes" ON public.promotion_codes;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
    AND role IN ('administrateur', 'super_administrateur')
  );
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can view all promo codes"
ON public.promotion_codes
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create promo codes"
ON public.promotion_codes
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update promo codes"
ON public.promotion_codes
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete promo codes"
ON public.promotion_codes
FOR DELETE
USING (public.is_admin(auth.uid()));