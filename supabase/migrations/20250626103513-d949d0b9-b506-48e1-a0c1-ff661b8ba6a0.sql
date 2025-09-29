
-- Fonction pour importer tous les produits et catégories de Châteaurenard vers St Martin de Crau avec de nouveaux IDs
CREATE OR REPLACE FUNCTION public.import_chateaurenard_to_stmartin_with_new_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  source_restaurant_id uuid := '11111111-1111-1111-1111-111111111111'; -- Châteaurenard
  target_restaurant_id uuid := '22222222-2222-2222-2222-222222222222'; -- St Martin de Crau
  category_record RECORD;
  product_record RECORD;
  new_category_id text;
  category_mapping jsonb := '{}';
BEGIN
  -- Supprimer d'abord toutes les catégories et produits existants pour St Martin de Crau
  DELETE FROM public.products WHERE restaurant_id = target_restaurant_id;
  DELETE FROM public.categories WHERE restaurant_id = target_restaurant_id;
  
  -- Copier toutes les catégories de Châteaurenard vers St Martin de Crau avec de nouveaux IDs
  FOR category_record IN 
    SELECT id, name, description, display_order
    FROM public.categories 
    WHERE restaurant_id = source_restaurant_id
    ORDER BY display_order
  LOOP
    -- Créer un nouvel ID pour la catégorie en ajoutant le suffixe "_stmartin"
    new_category_id := category_record.id || '_stmartin';
    
    -- Stocker le mapping ancien ID -> nouveau ID
    category_mapping := jsonb_set(category_mapping, ARRAY[category_record.id], to_jsonb(new_category_id));
    
    INSERT INTO public.categories (id, name, description, display_order, restaurant_id)
    VALUES (new_category_id, category_record.name, category_record.description, category_record.display_order, target_restaurant_id);
  END LOOP;
  
  -- Copier tous les produits de Châteaurenard vers St Martin de Crau en utilisant les nouveaux IDs de catégories
  FOR product_record IN 
    SELECT name, description, price, category_id, image_url, is_vegetarian, is_spicy, is_new, is_best_seller, is_gluten_free, allergens, pieces, prep_time
    FROM public.products 
    WHERE restaurant_id = source_restaurant_id
  LOOP
    INSERT INTO public.products (
      name, description, price, category_id, restaurant_id, image_url, 
      is_vegetarian, is_spicy, is_new, is_best_seller, is_gluten_free, 
      allergens, pieces, prep_time
    )
    VALUES (
      product_record.name, product_record.description, product_record.price, 
      (category_mapping->>product_record.category_id), target_restaurant_id, product_record.image_url,
      product_record.is_vegetarian, product_record.is_spicy, product_record.is_new,
      product_record.is_best_seller, product_record.is_gluten_free,
      product_record.allergens, product_record.pieces, product_record.prep_time
    );
  END LOOP;
  
  RAISE NOTICE 'Import terminé : toutes les catégories et produits de Châteaurenard ont été copiés vers St Martin de Crau avec de nouveaux IDs';
END;
$$;

-- Exécuter la fonction d'import
SELECT public.import_chateaurenard_to_stmartin_with_new_ids();

-- Supprimer la fonction après utilisation
DROP FUNCTION public.import_chateaurenard_to_stmartin_with_new_ids();
