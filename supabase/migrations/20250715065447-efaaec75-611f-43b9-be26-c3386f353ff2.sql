
-- Créer une table pour les restaurants avec leurs informations
CREATE TABLE public.restaurants_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour les horaires d'ouverture des restaurants
CREATE TABLE public.restaurants_info_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_info_id UUID NOT NULL REFERENCES public.restaurants_info(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 = Dimanche, 1 = Lundi, etc.
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME,
  close_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_info_id, day_of_week)
);

-- Activer Row Level Security
ALTER TABLE public.restaurants_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants_info_hours ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour restaurants_info
CREATE POLICY "Anyone can view active restaurants info" 
  ON public.restaurants_info 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage restaurants info" 
  ON public.restaurants_info 
  FOR ALL 
  USING (has_role(auth.uid(), 'administrateur'::user_role));

-- Politiques RLS pour restaurants_info_hours
CREATE POLICY "Anyone can view restaurants hours" 
  ON public.restaurants_info_hours 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.restaurants_info 
    WHERE id = restaurant_info_id AND is_active = true
  ));

CREATE POLICY "Admins can manage restaurants hours" 
  ON public.restaurants_info_hours 
  FOR ALL 
  USING (has_role(auth.uid(), 'administrateur'::user_role));

-- Insérer des données d'exemple
INSERT INTO public.restaurants_info (name, address, city, postal_code, phone, email, display_order)
VALUES 
  ('SushiEats Châteaurenard', '16 cours Carnot', 'Châteaurenard', '13160', '04 90 00 00 00', 'chateaurenard@sushieats.fr', 1),
  ('SushiEats Saint-Martin-de-Crau', '42 avenue de la République', 'Saint-Martin-de-Crau', '13310', '04 90 00 00 01', 'stmartin@sushieats.fr', 2);

-- Insérer les horaires pour Châteaurenard
INSERT INTO public.restaurants_info_hours (restaurant_info_id, day_of_week, is_open, open_time, close_time)
SELECT 
  (SELECT id FROM public.restaurants_info WHERE name = 'SushiEats Châteaurenard'),
  day,
  CASE WHEN day IN (0, 1) THEN false ELSE true END, -- Fermé dimanche et lundi
  CASE WHEN day IN (0, 1) THEN null ELSE '11:00'::time END,
  CASE WHEN day IN (0, 1) THEN null ELSE '22:00'::time END
FROM generate_series(0, 6) AS day;

-- Insérer les horaires pour Saint-Martin-de-Crau
INSERT INTO public.restaurants_info_hours (restaurant_info_id, day_of_week, is_open, open_time, close_time)
SELECT 
  (SELECT id FROM public.restaurants_info WHERE name = 'SushiEats Saint-Martin-de-Crau'),
  day,
  CASE WHEN day IN (0, 1) THEN false ELSE true END, -- Fermé dimanche et lundi
  CASE WHEN day IN (0, 1) THEN null ELSE '11:30'::time END,
  CASE WHEN day IN (0, 1) THEN null ELSE '21:30'::time END
FROM generate_series(0, 6) AS day;
