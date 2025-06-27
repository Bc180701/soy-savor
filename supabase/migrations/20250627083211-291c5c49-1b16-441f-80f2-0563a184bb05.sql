
-- Modifier la table delivery_locations pour avoir des zones spécifiques par restaurant
-- Ajouter des zones de livraison pour Châteaurenard
INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Châteaurenard', '13160', r.id, true
FROM restaurants r WHERE r.name = 'Châteaurenard'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Eyragues', '13630', r.id, true
FROM restaurants r WHERE r.name = 'Châteaurenard'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Barbentane', '13570', r.id, true
FROM restaurants r WHERE r.name = 'Châteaurenard'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Rognonas', '13870', r.id, true
FROM restaurants r WHERE r.name = 'Châteaurenard'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Graveson', '13690', r.id, true
FROM restaurants r WHERE r.name = 'Châteaurenard'
ON CONFLICT DO NOTHING;

-- Ajouter des zones de livraison pour Saint-Martin-de-Crau
INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Saint-Martin-de-Crau', '13310', r.id, true
FROM restaurants r WHERE r.name = 'Saint-Martin-de-Crau'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Arles', '13200', r.id, true
FROM restaurants r WHERE r.name = 'Saint-Martin-de-Crau'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Salon-de-Provence', '13300', r.id, true
FROM restaurants r WHERE r.name = 'Saint-Martin-de-Crau'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Istres', '13800', r.id, true
FROM restaurants r WHERE r.name = 'Saint-Martin-de-Crau'
ON CONFLICT DO NOTHING;

INSERT INTO delivery_locations (city, postal_code, restaurant_id, is_active) 
SELECT 'Miramas', '13140', r.id, true
FROM restaurants r WHERE r.name = 'Saint-Martin-de-Crau'
ON CONFLICT DO NOTHING;
