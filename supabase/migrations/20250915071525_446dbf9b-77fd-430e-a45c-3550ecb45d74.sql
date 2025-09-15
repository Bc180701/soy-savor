-- Créer la table de sauvegarde du panier
CREATE TABLE public.cart_backup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL, -- Email du client comme identifiant de session
  cart_items JSONB NOT NULL, -- Données complètes du panier
  restaurant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_used BOOLEAN NOT NULL DEFAULT false -- Marquer comme utilisé après récupération
);

-- Enable Row Level Security
ALTER TABLE public.cart_backup ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre l'insertion (webhook et frontend)
CREATE POLICY "Allow cart backup insertion" 
ON public.cart_backup 
FOR INSERT 
WITH CHECK (true);

-- Policy pour permettre la lecture (webhook seulement)
CREATE POLICY "Allow cart backup read for recovery" 
ON public.cart_backup 
FOR SELECT 
USING (true);

-- Policy pour permettre la mise à jour (marquer comme utilisé)
CREATE POLICY "Allow cart backup update" 
ON public.cart_backup 
FOR UPDATE 
USING (true);

-- Index pour optimiser les recherches par session_id
CREATE INDEX idx_cart_backup_session_id ON public.cart_backup(session_id);
CREATE INDEX idx_cart_backup_created_at ON public.cart_backup(created_at);

-- Fonction pour nettoyer les anciennes sauvegardes (plus de 7 jours)
CREATE OR REPLACE FUNCTION public.cleanup_old_cart_backups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.cart_backup 
  WHERE created_at < now() - INTERVAL '7 days';
END;
$$;