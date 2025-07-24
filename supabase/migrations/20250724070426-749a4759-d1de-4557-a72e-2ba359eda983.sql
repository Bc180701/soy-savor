-- Ajouter le support des créneaux multiples à la table restaurants_info_hours
ALTER TABLE public.restaurants_info_hours 
ADD COLUMN slot_number INTEGER NOT NULL DEFAULT 1;

-- Supprimer la contrainte unique existante
ALTER TABLE public.restaurants_info_hours 
DROP CONSTRAINT IF EXISTS restaurants_info_hours_restaurant_info_id_day_of_week_key;

-- Ajouter une nouvelle contrainte unique incluant le slot_number
ALTER TABLE public.restaurants_info_hours 
ADD CONSTRAINT restaurants_info_hours_unique_slot 
UNIQUE(restaurant_info_id, day_of_week, slot_number);

-- Ajouter une contrainte pour s'assurer que slot_number est positif
ALTER TABLE public.restaurants_info_hours 
ADD CONSTRAINT slot_number_positive CHECK (slot_number > 0);