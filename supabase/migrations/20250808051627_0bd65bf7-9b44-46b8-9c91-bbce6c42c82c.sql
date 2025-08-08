-- Permettre l'insertion d'orders sans user_id depuis les webhooks
CREATE POLICY "webhook_insert_orders" ON public.orders
FOR INSERT
WITH CHECK (true);

-- Permettre l'insertion d'order_items depuis les webhooks  
CREATE POLICY "webhook_insert_order_items" ON public.order_items
FOR INSERT  
WITH CHECK (true);