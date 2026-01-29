-- Ajouter la colonne pour le dessert personnalisé offert
ALTER TABLE public.special_events 
ADD COLUMN IF NOT EXISTS custom_free_dessert_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN public.special_events.custom_free_dessert_id IS 'Si défini, seul ce produit spécifique sera offert comme dessert (au lieu de tous les desserts)';