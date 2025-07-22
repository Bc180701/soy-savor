
-- Fonction pour copier tous les produits de St Martin de Crau vers Châteaurenard
CREATE OR REPLACE FUNCTION public.copy_products_stmartin_to_chateaurenard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  source_restaurant_id uuid := '22222222-2222-2222-2222-222222222222'; -- St Martin de Crau
  target_restaurant_id uuid := '11111111-1111-1111-1111-111111111111'; -- Châteaurenard
  product_record RECORD;
  target_category_id text;
BEGIN
  -- Supprimer d'abord tous les produits existants de Châteaurenard
  DELETE FROM public.products WHERE restaurant_id = target_restaurant_id;
  
  -- Copier tous les produits de St Martin de Crau vers Châteaurenard
  FOR product_record IN 
    SELECT name, description, price, category_id, image_url, is_vegetarian, is_spicy, 
           is_new, is_best_seller, is_gluten_free, allergens, pieces, prep_time
    FROM public.products 
    WHERE restaurant_id = source_restaurant_id
  LOOP
    -- Calculer l'ID de catégorie correspondant pour Châteaurenard (enlever le suffixe _stmartin)
    target_category_id := REPLACE(product_record.category_id, '_stmartin', '');
    
    -- Insérer le produit dans Châteaurenard
    INSERT INTO public.products (
      name, description, price, category_id, restaurant_id, image_url, 
      is_vegetarian, is_spicy, is_new, is_best_seller, is_gluten_free, 
      allergens, pieces, prep_time
    )
    VALUES (
      product_record.name, product_record.description, product_record.price, 
      target_category_id, target_restaurant_id, product_record.image_url,
      product_record.is_vegetarian, product_record.is_spicy, product_record.is_new,
      product_record.is_best_seller, product_record.is_gluten_free,
      product_record.allergens, product_record.pieces, product_record.prep_time
    );
  END LOOP;
  
  RAISE NOTICE 'Copie terminée : tous les produits de St Martin de Crau ont été copiés vers Châteaurenard avec les mêmes prix, tags et statuts';
END;
$$;

-- Exécuter la fonction de copie
SELECT public.copy_products_stmartin_to_chateaurenard();

-- Supprimer la fonction après utilisation
DROP FUNCTION public.copy_products_stmartin_to_chateaurenard();
