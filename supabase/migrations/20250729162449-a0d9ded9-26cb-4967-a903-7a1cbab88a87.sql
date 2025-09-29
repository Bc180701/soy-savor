-- Activer le realtime sur la table orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;