-- Créer la promotion "L'offre gourmande" pour les commandes à emporter uniquement
INSERT INTO day_based_promotions (
  title,
  description,
  discount,
  is_percentage,
  applicable_days,
  applicable_categories,
  start_time,
  end_time,
  is_active,
  restaurant_id
) VALUES (
  'L''offre gourmande',
  'Un dessert acheté = une boisson soft offerte ! Valable uniquement pour les commandes à emporter.',
  0,
  false,
  ARRAY[1, 2, 3, 4, 5, 6, 0],
  ARRAY['desserts'],
  '11:00',
  '22:00',
  true,
  NULL
);