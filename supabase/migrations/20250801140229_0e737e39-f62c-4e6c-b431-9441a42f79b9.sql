-- Créer la promotion "L'offre gourmande" pour les commandes à emporter uniquement
INSERT INTO day_based_promotions (
  title,
  description,
  discount,
  discount_type,
  applicable_days,
  applicable_categories,
  applicable_products,
  start_time,
  end_time,
  is_active,
  order_type_restriction,
  restaurant_id
) VALUES (
  'L''offre gourmande',
  'Un dessert acheté = une boisson soft offerte ! Valable uniquement pour les commandes à emporter.',
  0,
  'free_item',
  ARRAY['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  ARRAY['desserts'],
  NULL,
  '11:00',
  '22:00',
  true,
  'pickup',
  NULL
);