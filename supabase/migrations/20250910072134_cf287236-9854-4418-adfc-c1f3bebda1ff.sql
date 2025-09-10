-- Final fix for sushi_ingredients and poke_ingredients RLS policies
-- Use has_role() function for consistency with other working tables

-- Drop all existing policies on sushi_ingredients
DROP POLICY IF EXISTS "Admins can manage sushi ingredients" ON public.sushi_ingredients;
DROP POLICY IF EXISTS "Anyone can view sushi ingredients" ON public.sushi_ingredients;

-- Create new policies using has_role() function
CREATE POLICY "Admins can manage sushi ingredients"
ON public.sushi_ingredients
FOR ALL
USING (
  has_role(auth.uid(), 'administrateur'::user_role) OR 
  has_role(auth.uid(), 'super_administrateur'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'administrateur'::user_role) OR 
  has_role(auth.uid(), 'super_administrateur'::user_role)
);

CREATE POLICY "Anyone can view sushi ingredients"
ON public.sushi_ingredients
FOR SELECT
USING (true);

-- Drop all existing policies on poke_ingredients
DROP POLICY IF EXISTS "Allow admins full access" ON public.poke_ingredients;
DROP POLICY IF EXISTS "Allow public read access" ON public.poke_ingredients;

-- Create new policies using has_role() function
CREATE POLICY "Allow admins full access"
ON public.poke_ingredients
FOR ALL
USING (
  has_role(auth.uid(), 'administrateur'::user_role) OR 
  has_role(auth.uid(), 'super_administrateur'::user_role)
)
WITH CHECK (
  has_role(auth.uid(), 'administrateur'::user_role) OR 
  has_role(auth.uid(), 'super_administrateur'::user_role)
);

CREATE POLICY "Allow public read access"
ON public.poke_ingredients
FOR SELECT
USING (true);