-- Drop existing policies on event_products
DROP POLICY IF EXISTS "Admins can manage event products" ON public.event_products;
DROP POLICY IF EXISTS "Anyone can view event products" ON public.event_products;

-- Create updated policies that include super_administrateur
CREATE POLICY "Admins can manage event products" 
ON public.event_products 
FOR ALL 
USING (has_role(auth.uid(), 'administrateur'::user_role) OR has_role(auth.uid(), 'super_administrateur'::user_role));

CREATE POLICY "Anyone can view event products" 
ON public.event_products 
FOR SELECT 
USING (true);