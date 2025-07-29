-- Activer RLS sur les tables qui n'en ont pas
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sushi_ingredients ENABLE ROW LEVEL SECURITY;

-- Ajouter des politiques RLS pour ces tables

-- Pour restaurants - permettre la lecture à tous, mais seulement les admins peuvent modifier
CREATE POLICY "Anyone can view restaurants" 
ON public.restaurants 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage restaurants" 
ON public.restaurants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrateur'
  )
);

-- Pour delivery_locations - même logique
CREATE POLICY "Anyone can view delivery locations" 
ON public.delivery_locations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage delivery locations" 
ON public.delivery_locations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrateur'
  )
);

-- Pour promo_code_usage - seulement les admins
CREATE POLICY "Admins can manage promo code usage" 
ON public.promo_code_usage 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrateur'
  )
);

-- Pour sushi_ingredients - lecture publique, modification admin
CREATE POLICY "Anyone can view sushi ingredients" 
ON public.sushi_ingredients 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage sushi ingredients" 
ON public.sushi_ingredients 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrateur'
  )
);

-- Vérifier que la table featured_products_settings a bien les bonnes politiques RLS
-- et permettre aussi la lecture publique pour la page d'accueil
CREATE POLICY "Anyone can view featured products settings" 
ON public.featured_products_settings 
FOR SELECT 
USING (true);