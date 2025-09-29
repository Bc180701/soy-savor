-- Create the produits_carte table for the carte page
CREATE TABLE public.produits_carte (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category_id text NOT NULL,
  allergens text[],
  pieces integer,
  is_vegetarian boolean DEFAULT false,
  is_gluten_free boolean DEFAULT false,
  is_spicy boolean DEFAULT false,
  prep_time integer DEFAULT 10,
  source_product_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produits_carte ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view produits carte" 
ON public.produits_carte 
FOR SELECT 
USING (true);

-- Create policy for admin management
CREATE POLICY "Admins can manage produits carte" 
ON public.produits_carte 
FOR ALL 
USING (has_role(auth.uid(), 'administrateur'::user_role))
WITH CHECK (has_role(auth.uid(), 'administrateur'::user_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_produits_carte_updated_at
BEFORE UPDATE ON public.produits_carte
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing products from Châteaurenard restaurant
INSERT INTO public.produits_carte (
  name, description, price, image_url, category_id, allergens, pieces,
  is_vegetarian, is_gluten_free, is_spicy, prep_time, source_product_id
)
SELECT 
  name, description, price, image_url, category_id, allergens, pieces,
  is_vegetarian, is_gluten_free, is_spicy, prep_time, id as source_product_id
FROM public.products 
WHERE restaurant_id = '11111111-1111-1111-1111-111111111111';