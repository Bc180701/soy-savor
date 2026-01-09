-- Enable RLS on promotion_codes table
ALTER TABLE public.promotion_codes ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all promo codes
CREATE POLICY "Admins can view all promo codes"
ON public.promotion_codes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrateur', 'super_administrateur')
  )
);

-- Policy for admins to insert promo codes
CREATE POLICY "Admins can create promo codes"
ON public.promotion_codes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrateur', 'super_administrateur')
  )
);

-- Policy for admins to update promo codes
CREATE POLICY "Admins can update promo codes"
ON public.promotion_codes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrateur', 'super_administrateur')
  )
);

-- Policy for admins to delete promo codes
CREATE POLICY "Admins can delete promo codes"
ON public.promotion_codes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('administrateur', 'super_administrateur')
  )
);

-- Policy for public to validate promo codes (read only active ones)
CREATE POLICY "Public can validate active promo codes"
ON public.promotion_codes
FOR SELECT
USING (is_active = true);