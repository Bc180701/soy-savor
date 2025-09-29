-- Corriger les category_id dans produits_carte pour qu'ils correspondent aux IDs des catégories
UPDATE public.produits_carte SET category_id = 'makis' WHERE category_id = 'maki';

-- Vérifier si d'autres mappings sont nécessaires
-- Les autres category_id semblent déjà correspondre correctement