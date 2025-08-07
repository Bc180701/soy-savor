-- Supprimer les anciennes politiques restrictives pour order_items
DROP POLICY IF EXISTS "Users can create their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;

-- Créer une nouvelle politique qui permet les insertions pour les commandes anonymes ET authentifiées
CREATE POLICY "Allow order item insertion for all orders" 
ON order_items 
FOR INSERT 
WITH CHECK (
  -- Soit l'utilisateur est connecté et propriétaire de la commande
  (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ))
  OR
  -- Soit c'est une commande anonyme (user_id null) et l'ordre existe
  (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id IS NULL
  ))
);

-- Politique pour la lecture : admins + propriétaires
CREATE POLICY "Users and admins can view order items" 
ON order_items 
FOR SELECT 
USING (
  -- Admins peuvent tout voir
  has_role(auth.uid(), 'administrateur'::user_role) 
  OR has_role(auth.uid(), 'cuisinier'::user_role) 
  OR has_role(auth.uid(), 'livreur'::user_role)
  OR
  -- Utilisateurs connectés peuvent voir leurs propres order_items
  (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  ))
);