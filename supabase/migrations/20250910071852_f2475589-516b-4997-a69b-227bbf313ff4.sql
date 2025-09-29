-- Fix sushi_ingredients policies to use consistent syntax
DROP POLICY IF EXISTS "Admins can manage sushi ingredients" ON public.sushi_ingredients;
DROP POLICY IF EXISTS "Anyone can view sushi ingredients" ON public.sushi_ingredients;

CREATE POLICY "Admins can manage sushi ingredients"
ON public.sushi_ingredients
FOR ALL
USING (EXISTS (
  SELECT 1
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('administrateur'::user_role, 'super_administrateur'::user_role)
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('administrateur'::user_role, 'super_administrateur'::user_role)
));

CREATE POLICY "Anyone can view sushi ingredients"
ON public.sushi_ingredients
FOR SELECT
USING (true);

-- Fix poke_ingredients policies to use consistent syntax
DROP POLICY IF EXISTS "Allow admins full access" ON public.poke_ingredients;
DROP POLICY IF EXISTS "Allow public read access" ON public.poke_ingredients;

CREATE POLICY "Allow admins full access"
ON public.poke_ingredients
FOR ALL
USING (EXISTS (
  SELECT 1
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('administrateur'::user_role, 'super_administrateur'::user_role)
))
WITH CHECK (EXISTS (
  SELECT 1
  FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role IN ('administrateur'::user_role, 'super_administrateur'::user_role)
));

CREATE POLICY "Allow public read access"
ON public.poke_ingredients
FOR SELECT
USING (true);