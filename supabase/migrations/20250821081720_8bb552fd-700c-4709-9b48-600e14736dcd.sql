-- Fix RLS policies for restaurant_opening_hours table
-- First, ensure RLS is enabled
ALTER TABLE public.restaurant_opening_hours ENABLE ROW LEVEL SECURITY;

-- Update existing policies to properly allow admin access for managing opening hours
DROP POLICY IF EXISTS "Admins can manage opening hours" ON public.restaurant_opening_hours;
DROP POLICY IF EXISTS "Anyone can view opening hours" ON public.restaurant_opening_hours;

-- Create new policies
CREATE POLICY "Admins can manage opening hours" 
ON public.restaurant_opening_hours 
FOR ALL 
USING (has_role(auth.uid(), 'administrateur'::user_role) OR has_role(auth.uid(), 'super_administrateur'::user_role))
WITH CHECK (has_role(auth.uid(), 'administrateur'::user_role) OR has_role(auth.uid(), 'super_administrateur'::user_role));

CREATE POLICY "Anyone can view opening hours" 
ON public.restaurant_opening_hours 
FOR SELECT 
USING (true);