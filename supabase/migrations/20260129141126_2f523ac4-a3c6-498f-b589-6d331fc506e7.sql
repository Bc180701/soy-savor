-- Ajouter la colonne pour l'offre desserts offerts sur les événements spéciaux
ALTER TABLE public.special_events 
ADD COLUMN IF NOT EXISTS free_desserts_enabled boolean DEFAULT false;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN public.special_events.free_desserts_enabled IS 'Si activé, les desserts sont gratuits quand un produit de cet événement est dans le panier';