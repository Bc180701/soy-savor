-- Ajouter la colonne order_id à cart_backup pour lier directement au bon order
ALTER TABLE public.cart_backup 
ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Index pour les performances de recherche par order_id
CREATE INDEX idx_cart_backup_order_id ON public.cart_backup(order_id);

-- Nettoyer les anciens cart_backup orphelins (plus de 7 jours et non utilisés)
UPDATE public.cart_backup 
SET is_used = true 
WHERE created_at < NOW() - INTERVAL '7 days' AND is_used = false;