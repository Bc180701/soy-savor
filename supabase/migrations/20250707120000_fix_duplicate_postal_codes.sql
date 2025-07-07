
-- Supprimer les doublons de la table delivery_locations
-- Garder seulement un enregistrement par combinaison (city, postal_code, restaurant_id)

-- Créer une table temporaire avec des données uniques
CREATE TEMP TABLE unique_delivery_locations AS
SELECT DISTINCT ON (city, postal_code, restaurant_id)
    city, postal_code, restaurant_id, is_active, created_at
FROM delivery_locations
ORDER BY city, postal_code, restaurant_id, created_at DESC;

-- Vider la table originale
DELETE FROM delivery_locations;

-- Réinsérer les données uniques
INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active, created_at)
SELECT city, postal_code, restaurant_id, is_active, created_at
FROM unique_delivery_locations;

-- Ajouter une contrainte unique pour éviter les futurs doublons
ALTER TABLE delivery_locations 
ADD CONSTRAINT unique_delivery_location 
UNIQUE (city, postal_code, restaurant_id);
