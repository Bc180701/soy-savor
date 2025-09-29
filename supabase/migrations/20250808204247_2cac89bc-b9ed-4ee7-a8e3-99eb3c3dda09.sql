-- Table pour mapper les noms de produits/options vers des codes courts
CREATE TABLE public.product_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  item_type text NOT NULL DEFAULT 'product', -- 'product', 'extra', 'sauce', etc.
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index pour une recherche rapide
CREATE INDEX idx_product_codes_name ON public.product_codes(item_name);
CREATE INDEX idx_product_codes_code ON public.product_codes(code);

-- Fonction pour générer automatiquement un code unique
CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  counter int := 1;
  letters text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  base_length int := 1;
BEGIN
  LOOP
    -- Générer un code de longueur variable (A, B, ..., Z, AA, AB, etc.)
    IF counter <= 26 THEN
      new_code := substring(letters, counter, 1);
    ELSIF counter <= 702 THEN -- 26 + 26*26
      new_code := substring(letters, ((counter - 27) / 26) + 1, 1) || 
                  substring(letters, ((counter - 27) % 26) + 1, 1);
    ELSE
      -- Triple lettres si nécessaire (AAA, AAB, etc.)
      new_code := 'A' || substring(letters, ((counter - 703) / 26) + 1, 1) || 
                  substring(letters, ((counter - 703) % 26) + 1, 1);
    END IF;
    
    -- Vérifier si le code est unique
    IF NOT EXISTS (SELECT 1 FROM public.product_codes WHERE code = new_code) THEN
      RETURN new_code;
    END IF;
    
    counter := counter + 1;
    
    -- Sécurité pour éviter une boucle infinie
    IF counter > 10000 THEN
      RAISE EXCEPTION 'Impossible de générer un code unique';
    END IF;
  END LOOP;
END;
$$;

-- Fonction pour obtenir ou créer un code pour un item
CREATE OR REPLACE FUNCTION public.get_or_create_product_code(
  p_item_name text,
  p_item_type text DEFAULT 'product'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_code text;
  new_code text;
BEGIN
  -- Chercher un code existant
  SELECT code INTO existing_code 
  FROM public.product_codes 
  WHERE item_name = p_item_name;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Créer un nouveau code
  new_code := generate_product_code();
  
  INSERT INTO public.product_codes (item_name, code, item_type)
  VALUES (p_item_name, new_code, p_item_type);
  
  RETURN new_code;
END;
$$;

-- Fonction pour décoder un items_summary avec codes
CREATE OR REPLACE FUNCTION public.decode_items_summary(encoded_summary jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  decoded_items jsonb := '[]'::jsonb;
  item jsonb;
  decoded_name text;
BEGIN
  -- Parcourir chaque item encodé
  FOR item IN SELECT * FROM jsonb_array_elements(encoded_summary)
  LOOP
    -- Récupérer le vrai nom à partir du code
    SELECT item_name INTO decoded_name
    FROM public.product_codes
    WHERE code = (item->>'n');
    
    -- Si pas trouvé, garder le code original
    IF decoded_name IS NULL THEN
      decoded_name := item->>'n';
    END IF;
    
    -- Ajouter l'item décodé
    decoded_items := decoded_items || jsonb_build_array(
      jsonb_build_object(
        'name', decoded_name,
        'price', (item->>'p')::numeric,
        'quantity', (item->>'q')::integer
      )
    );
  END LOOP;
  
  RETURN decoded_items;
END;
$$;

-- RLS policies
ALTER TABLE public.product_codes ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les codes (nécessaire pour la cuisine)
CREATE POLICY "Anyone can view product codes" 
ON public.product_codes 
FOR SELECT 
USING (true);

-- Seules les fonctions peuvent écrire (sécurité)
CREATE POLICY "Only functions can manage codes" 
ON public.product_codes 
FOR ALL 
USING (false)
WITH CHECK (false);