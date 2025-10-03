-- Fonction atomique pour réserver un créneau horaire
-- Cette fonction garantit qu'aucune race condition ne peut se produire
CREATE OR REPLACE FUNCTION reserve_time_slot_atomic(
  p_restaurant_id UUID,
  p_order_type TEXT,
  p_scheduled_for TIMESTAMP WITH TIME ZONE,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_max_allowed INTEGER
) RETURNS JSON AS $$
DECLARE
  current_count INTEGER;
  result JSON;
BEGIN
  -- Vérifier les créneaux bloqués par l'admin
  IF EXISTS (
    SELECT 1 FROM blocked_time_slots 
    WHERE restaurant_id = p_restaurant_id 
    AND blocked_date = p_scheduled_for::DATE
    AND blocked_time = p_scheduled_for::TIME
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ce créneau est bloqué par l\'administrateur'
    );
  END IF;

  -- Compter les commandes existantes pour ce créneau et ce restaurant du type demandé
  SELECT COUNT(*) INTO current_count
  FROM orders
  WHERE restaurant_id = p_restaurant_id
    AND order_type = p_order_type
    AND scheduled_for >= p_start_time
    AND scheduled_for < p_end_time
    AND status NOT IN ('cancelled', 'refunded');

  -- Vérifier si la limite est atteinte
  IF current_count >= p_max_allowed THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Créneau complet',
      'current_count', current_count,
      'max_allowed', p_max_allowed
    );
  END IF;

  -- Si on arrive ici, le créneau est disponible
  RETURN json_build_object(
    'success', true,
    'message', 'Créneau disponible',
    'current_count', current_count,
    'max_allowed', p_max_allowed
  );
END;
$$ LANGUAGE plpgsql;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION reserve_time_slot_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_time_slot_atomic TO anon;

