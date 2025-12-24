-- Désactiver tous les produits (is_new = false)
UPDATE public.products SET is_new = false WHERE is_new = true;