-- Update RLS policy for restaurants_info to allow authenticated users
DROP POLICY IF EXISTS "Admins can manage restaurants info" ON public.restaurants_info;

CREATE POLICY "Authenticated users can manage restaurants info"
ON public.restaurants_info
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Update RLS policy for restaurants_info_hours to allow authenticated users  
DROP POLICY IF EXISTS "Admins can manage restaurants hours" ON public.restaurants_info_hours;

CREATE POLICY "Authenticated users can manage restaurants hours"
ON public.restaurants_info_hours
FOR ALL  
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);