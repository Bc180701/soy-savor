-- Ajouter une colonne pour spécifier le type de blocage
ALTER TABLE public.blocked_time_slots 
ADD COLUMN blocked_service_type text NOT NULL DEFAULT 'both';

-- Ajouter une contrainte pour valider les valeurs
ALTER TABLE public.blocked_time_slots 
ADD CONSTRAINT blocked_service_type_check 
CHECK (blocked_service_type IN ('delivery', 'pickup', 'both'));

-- Ajouter un commentaire pour expliquer les valeurs
COMMENT ON COLUMN public.blocked_time_slots.blocked_service_type IS 'Type de service bloqué: delivery (livraison uniquement), pickup (retrait uniquement), both (les deux)';

-- Mettre à jour les enregistrements existants pour les marquer comme "both" (déjà fait par la valeur par défaut)
-- UPDATE public.blocked_time_slots SET blocked_service_type = 'both' WHERE blocked_service_type IS NULL;