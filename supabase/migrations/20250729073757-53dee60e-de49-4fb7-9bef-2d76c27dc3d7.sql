-- Vérifier si la table featured_products_settings existe et a des données
SELECT * FROM public.featured_products_settings LIMIT 1;

-- S'assurer que les données par défaut existent
INSERT INTO public.featured_products_settings (show_nouveautes, show_populaires, show_exclusivites)
SELECT true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.featured_products_settings);