-- Nettoyer les anciennes politiques en double sur order_items
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;

-- Garder seulement les politiques propres que nous avons créées
-- "Admins can view all order items" - OK pour les admins
-- "Allow order item insertion for all orders" - OK pour l'insertion
-- "Users and admins can view order items" - OK pour la lecture