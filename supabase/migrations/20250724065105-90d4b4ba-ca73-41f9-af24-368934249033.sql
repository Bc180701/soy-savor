-- Modifier la table restaurant_opening_hours pour supporter plusieurs créneaux par jour
-- Ajouter un champ pour identifier les créneaux multiples
ALTER TABLE public.restaurant_opening_hours 
ADD COLUMN slot_number INTEGER NOT NULL DEFAULT 1;

-- Supprimer la contrainte unique existante
ALTER TABLE public.restaurant_opening_hours 
DROP CONSTRAINT IF EXISTS restaurant_opening_hours_restaurant_id_day_of_week_key;

-- Ajouter une nouvelle contrainte unique incluant le slot_number
ALTER TABLE public.restaurant_opening_hours 
ADD CONSTRAINT restaurant_opening_hours_unique_slot 
UNIQUE(restaurant_id, day_of_week, slot_number);

-- Ajouter une contrainte pour s'assurer que slot_number est positif
ALTER TABLE public.restaurant_opening_hours 
ADD CONSTRAINT slot_number_positive CHECK (slot_number > 0);