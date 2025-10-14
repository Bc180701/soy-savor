-- Table pour stocker les subscriptions push des admins
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subscription_data JSONB NOT NULL,
  subscription_endpoint TEXT GENERATED ALWAYS AS (subscription_data->>'endpoint') STORED,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte d'unicité sur une colonne générée
  UNIQUE(user_id, restaurant_id, subscription_endpoint)
);

-- Index pour performance
CREATE INDEX idx_push_subscriptions_restaurant ON push_subscriptions(restaurant_id);
CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Activer RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- POLICY 1 : Insertion - Seulement admins authentifiés pour leurs propres subscriptions
CREATE POLICY "Admins can insert own subscriptions"
ON push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'administrateur'::user_role)
);

-- POLICY 2 : Lecture - Seulement admins pour leurs propres subscriptions
CREATE POLICY "Admins can view own subscriptions"
ON push_subscriptions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'administrateur'::user_role)
);

-- POLICY 3 : Suppression - Seulement admins pour leurs propres subscriptions
CREATE POLICY "Admins can delete own subscriptions"
ON push_subscriptions
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'administrateur'::user_role)
);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();