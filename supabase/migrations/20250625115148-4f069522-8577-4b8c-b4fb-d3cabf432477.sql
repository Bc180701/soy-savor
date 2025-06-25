
-- Créer la table restaurants
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  postal_code text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ajouter le restaurant existant (Châteaurenard)
INSERT INTO public.restaurants (id, name, city, is_active) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Châteaurenard', 'Châteaurenard', true);

-- Ajouter le nouveau restaurant (St Martin de Crau)
INSERT INTO public.restaurants (id, name, city, is_active) 
VALUES ('22222222-2222-2222-2222-222222222222', 'St Martin de Crau', 'St Martin de Crau', true);

-- Ajouter restaurant_id aux tables existantes
ALTER TABLE public.categories ADD COLUMN restaurant_id uuid REFERENCES public.restaurants(id);
ALTER TABLE public.products ADD COLUMN restaurant_id uuid REFERENCES public.restaurants(id);
ALTER TABLE public.orders ADD COLUMN restaurant_id uuid REFERENCES public.restaurants(id);
ALTER TABLE public.promotions ADD COLUMN restaurant_id uuid REFERENCES public.restaurants(id);
ALTER TABLE public.day_based_promotions ADD COLUMN restaurant_id uuid REFERENCES public.restaurants(id);
ALTER TABLE public.delivery_locations ADD COLUMN restaurant_id uuid REFERENCES public.restaurants(id);

-- Migrer les données existantes vers le restaurant Châteaurenard
UPDATE public.categories SET restaurant_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.products SET restaurant_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.orders SET restaurant_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.promotions SET restaurant_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.day_based_promotions SET restaurant_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.delivery_locations SET restaurant_id = '11111111-1111-1111-1111-111111111111';

-- Rendre restaurant_id obligatoire après migration
ALTER TABLE public.categories ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.products ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.promotions ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.day_based_promotions ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE public.delivery_locations ALTER COLUMN restaurant_id SET NOT NULL;

-- Créer des index pour améliorer les performances
CREATE INDEX idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX idx_products_restaurant_id ON public.products(restaurant_id);
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX idx_promotions_restaurant_id ON public.promotions(restaurant_id);
CREATE INDEX idx_day_based_promotions_restaurant_id ON public.day_based_promotions(restaurant_id);
CREATE INDEX idx_delivery_locations_restaurant_id ON public.delivery_locations(restaurant_id);

-- Ajouter un trigger pour updated_at sur restaurants
CREATE TRIGGER update_restaurants_updated_at 
  BEFORE UPDATE ON public.restaurants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
