-- Fix RLS policies for sushi_ingredients to allow super_administrateur role
DROP POLICY IF EXISTS "Admins can manage sushi ingredients" ON public.sushi_ingredients;

CREATE POLICY "Admins can manage sushi ingredients" 
ON public.sushi_ingredients 
FOR ALL 
USING (EXISTS ( 
  SELECT 1
  FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role IN ('administrateur'::user_role, 'super_administrateur'::user_role)))
))
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role IN ('administrateur'::user_role, 'super_administrateur'::user_role)))
));

-- Fix RLS policies for poke_ingredients to allow super_administrateur role  
DROP POLICY IF EXISTS "Allow admins full access" ON public.poke_ingredients;

CREATE POLICY "Allow admins full access" 
ON public.poke_ingredients 
FOR ALL 
USING (EXISTS ( 
  SELECT 1
  FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role IN ('administrateur'::user_role, 'super_administrateur'::user_role)))
))
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role IN ('administrateur'::user_role, 'super_administrateur'::user_role)))
));