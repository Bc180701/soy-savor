-- Activer tous les produits de Châteaurenard (is_new = true)
UPDATE public.products 
SET is_new = true 
WHERE restaurant_id = '11111111-1111-1111-1111-111111111111' 
  AND is_new = false;