-- S'assurer que REPLICA IDENTITY est bien configuré pour la table orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;