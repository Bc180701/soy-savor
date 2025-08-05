-- Activer le realtime pour la table orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Ajouter la table à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;