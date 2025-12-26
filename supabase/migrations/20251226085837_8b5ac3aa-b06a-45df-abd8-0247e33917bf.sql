
-- Dupliquer les produits de Châteaurenard vers St Martin de Crau
-- Exclure boissons, desserts et événements (déjà présents)

INSERT INTO products (
  name, description, price, category_id, restaurant_id, image_url,
  allergens, pieces, is_vegetarian, is_gluten_free, is_spicy,
  prep_time, is_best_seller, is_new, is_extra, is_hidden
)
SELECT 
  p.name,
  p.description,
  p.price,
  -- Mapping des catégories Châteaurenard vers St Martin
  CASE p.category_id
    WHEN 'accompagnements' THEN 'accompagnements_stmartin'
    WHEN 'box_du_midi' THEN 'box_du_midi_stmartin'
    WHEN 'california' THEN 'california_stmartin'
    WHEN 'chirashi' THEN 'chirashi_stmartin'
    WHEN 'crispy' THEN 'crispy_stmartin'
    WHEN 'green' THEN 'green_stmartin'
    WHEN 'gunkan' THEN 'gunkan_stmartin'
    WHEN 'maki' THEN 'maki_stmartin'
    WHEN 'nigiri' THEN 'nigiri_stmartin'
    WHEN 'plateaux' THEN 'plateaux_stmartin'
    WHEN 'poke' THEN 'poke_stmartin'
    WHEN 'salmon' THEN 'salmon_stmartin'
    WHEN 'sashimi' THEN 'sashimi_stmartin'
    WHEN 'signature' THEN 'signature_stmartin'
    WHEN 'spring' THEN 'spring_stmartin'
    WHEN 'custom' THEN 'custom_stmartin'
    WHEN 'maki_wrap' THEN 'maki_wrap_stmartin'
    WHEN 'temaki' THEN 'temaki_stmartin'
    WHEN 'tartare' THEN 'tartare_stmartin'
    WHEN 'triangle' THEN 'triangle_stmartin'
    WHEN 'yakitori' THEN 'yakitori_stmartin'
    ELSE p.category_id || '_stmartin'
  END as category_id,
  '22222222-2222-2222-2222-222222222222' as restaurant_id,
  p.image_url,
  p.allergens,
  p.pieces,
  p.is_vegetarian,
  p.is_gluten_free,
  p.is_spicy,
  p.prep_time,
  p.is_best_seller,
  p.is_new,
  p.is_extra,
  p.is_hidden
FROM products p
WHERE p.restaurant_id = '11111111-1111-1111-1111-111111111111'
  AND p.category_id NOT IN ('boissons', 'desserts', 'extras')
  -- Éviter les doublons - ne pas insérer si le produit existe déjà
  AND NOT EXISTS (
    SELECT 1 FROM products existing 
    WHERE existing.restaurant_id = '22222222-2222-2222-2222-222222222222'
      AND existing.name = p.name
  );
