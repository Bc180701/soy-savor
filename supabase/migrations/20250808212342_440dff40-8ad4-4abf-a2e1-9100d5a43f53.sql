-- Corriger la fonction decode_items_summary pour convertir les centimes en euros
CREATE OR REPLACE FUNCTION public.decode_items_summary(encoded_summary jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
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
        'price', ((item->>'p')::numeric / 100), -- Convertir centimes en euros
        'quantity', (item->>'q')::integer
      )
    );
  END LOOP;
  
  RETURN decoded_items;
END;
$$;