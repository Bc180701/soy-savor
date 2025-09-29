
-- Ajouter la colonne is_gluten_free à la table products
ALTER TABLE public.products 
ADD COLUMN is_gluten_free BOOLEAN DEFAULT false;
