
-- Activer tous les produits de St Martin de Crau (is_new = true)
UPDATE public.products 
SET is_new = true 
WHERE restaurant_id = '22222222-2222-2222-2222-222222222222' 
  AND is_new = false;
