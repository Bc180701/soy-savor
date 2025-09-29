-- Corriger la politique RLS pour inclure les super administrateurs
DROP POLICY IF EXISTS "Admins can manage restaurants" ON public.restaurants;

CREATE POLICY "Admins can manage restaurants" 
ON public.restaurants 
FOR ALL 
USING (
  has_role(auth.uid(), 'administrateur'::user_role) OR 
  has_role(auth.uid(), 'super_administrateur'::user_role)
);