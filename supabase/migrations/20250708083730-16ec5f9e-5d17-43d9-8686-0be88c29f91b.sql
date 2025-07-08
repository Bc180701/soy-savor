-- Ajouter la colonne stripe_session_id à la table orders
ALTER TABLE public.orders 
ADD COLUMN stripe_session_id TEXT UNIQUE;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id);