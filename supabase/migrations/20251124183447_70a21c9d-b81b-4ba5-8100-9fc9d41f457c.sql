-- Allow users to read promo code usage for validation (public read for email check)
CREATE POLICY "Allow public read for promo code usage validation"
ON public.promo_code_usage
FOR SELECT
USING (true);

-- Allow insertion for tracking usage (guests and authenticated users)
CREATE POLICY "Allow insertion for promo code usage tracking"
ON public.promo_code_usage
FOR INSERT
WITH CHECK (true);