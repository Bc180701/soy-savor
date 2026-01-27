-- Synchroniser les descriptions et images de produits_carte avec products (source)
UPDATE public.produits_carte pc
SET 
  description = p.description,
  image_url = p.image_url,
  updated_at = now()
FROM public.products p
WHERE pc.source_product_id = p.id
  AND pc.source_product_id IS NOT NULL
  AND (pc.description IS DISTINCT FROM p.description OR pc.image_url IS DISTINCT FROM p.image_url);