-- Modifier la table product_codes pour stocker la description complète
ALTER TABLE public.product_codes 
ADD COLUMN IF NOT EXISTS item_description TEXT DEFAULT '';

-- Mettre à jour la fonction pour inclure la description dans la génération du code
CREATE OR REPLACE FUNCTION public.get_or_create_product_code(
  p_item_name text, 
  p_item_type text DEFAULT 'product'::text,
  p_item_description text DEFAULT ''::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  existing_code text;
  new_code text;
  combined_key text;
BEGIN
  -- Créer une clé combinée pour identifier uniquement chaque création
  combined_key := p_item_name || '|' || COALESCE(p_item_description, '');
  
  -- Chercher un code existant pour cette combinaison exacte
  SELECT code INTO existing_code 
  FROM public.product_codes 
  WHERE item_name = p_item_name 
  AND COALESCE(item_description, '') = COALESCE(p_item_description, '');
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Créer un nouveau code
  new_code := generate_product_code();
  
  INSERT INTO public.product_codes (item_name, code, item_type, item_description)
  VALUES (p_item_name, new_code, p_item_type, COALESCE(p_item_description, ''));
  
  RETURN new_code;
END;
$function$;

-- Mettre à jour la fonction de décodage pour retourner aussi la description
CREATE OR REPLACE FUNCTION public.decode_items_summary(encoded_summary jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  decoded_items jsonb := '[]'::jsonb;
  item jsonb;
  decoded_name text;
  decoded_description text;
BEGIN
  -- Parcourir chaque item encodé
  FOR item IN SELECT * FROM jsonb_array_elements(encoded_summary)
  LOOP
    -- Récupérer le vrai nom et la description à partir du code
    SELECT item_name, item_description INTO decoded_name, decoded_description
    FROM public.product_codes
    WHERE code = (item->>'n');
    
    -- Si pas trouvé, garder le code original
    IF decoded_name IS NULL THEN
      decoded_name := item->>'n';
      decoded_description := '';
    END IF;
    
    -- Ajouter l'item décodé avec sa description
    decoded_items := decoded_items || jsonb_build_array(
      jsonb_build_object(
        'name', decoded_name,
        'description', COALESCE(decoded_description, ''),
        'price', (item->>'p')::numeric,
        'quantity', (item->>'q')::integer
      )
    );
  END LOOP;
  
  RETURN decoded_items;
END;
$function$;