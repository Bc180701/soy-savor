
-- Créer une table pour les horaires d'ouverture par restaurant
CREATE TABLE public.restaurant_opening_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = dimanche, 1 = lundi, etc.
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME NOT NULL DEFAULT '11:00',
  close_time TIME NOT NULL DEFAULT '22:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, day_of_week)
);

-- Créer une table pour les fermetures temporaires
CREATE TABLE public.restaurant_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  closure_date DATE NOT NULL,
  reason TEXT,
  is_all_day BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter des politiques RLS
ALTER TABLE public.restaurant_opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_closures ENABLE ROW LEVEL SECURITY;

-- Politiques pour restaurant_opening_hours
CREATE POLICY "Anyone can view opening hours" 
  ON public.restaurant_opening_hours 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage opening hours" 
  ON public.restaurant_opening_hours 
  FOR ALL 
  USING (has_role(auth.uid(), 'administrateur'::user_role));

-- Politiques pour restaurant_closures
CREATE POLICY "Anyone can view closures" 
  ON public.restaurant_closures 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage closures" 
  ON public.restaurant_closures 
  FOR ALL 
  USING (has_role(auth.uid(), 'administrateur'::user_role));

-- Migrer les données existantes depuis homepage_sections vers restaurant_opening_hours
INSERT INTO public.restaurant_opening_hours (restaurant_id, day_of_week, is_open, open_time, close_time)
SELECT 
  r.id as restaurant_id,
  CASE 
    WHEN (data->>'day') = 'sunday' THEN 0
    WHEN (data->>'day') = 'monday' THEN 1
    WHEN (data->>'day') = 'tuesday' THEN 2
    WHEN (data->>'day') = 'wednesday' THEN 3
    WHEN (data->>'day') = 'thursday' THEN 4
    WHEN (data->>'day') = 'friday' THEN 5
    WHEN (data->>'day') = 'saturday' THEN 6
  END as day_of_week,
  (data->>'is_open')::boolean as is_open,
  (data->>'open_time')::time as open_time,
  (data->>'close_time')::time as close_time
FROM 
  public.restaurants r
  CROSS JOIN (
    SELECT jsonb_array_elements(section_data) as data
    FROM public.homepage_sections 
    WHERE section_name = 'opening_hours'
  ) hours_data
WHERE r.is_active = true;

-- Ajouter des triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurant_opening_hours_updated_at
    BEFORE UPDATE ON public.restaurant_opening_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_closures_updated_at
    BEFORE UPDATE ON public.restaurant_closures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
