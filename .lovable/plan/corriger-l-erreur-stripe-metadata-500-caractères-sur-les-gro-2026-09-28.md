# Corriger l'erreur Stripe « metadata > 500 caractères » sur les gros paniers

## Problème (confirmé dans le code)
La fonction de création du paiement envoie le panier compacté entier dans `metadata.items_summary` de la session Stripe. Au-delà d'environ 20 articles, ça dépasse 500 caractères et Stripe refuse la session : le client ne peut pas payer. Les notes client (`customer_notes`) peuvent aussi dépasser la limite.

## Solution
Le panier complet n'est plus envoyé à Stripe. Il est sauvegardé dans Supabase avant le paiement, et Stripe ne reçoit qu'une référence courte.

1. **Création du paiement (`create-checkout`)**
   - Générer un identifiant de brouillon (`draft_id`) et enregistrer côté serveur le panier complet (articles, options, extras, notes, infos client) dans une table dédiée `checkout_drafts`.
   - Metadata Stripe réduites à des champs courts : `draft_id`, `restaurant_id`, `order_type`, montants, nom/email/téléphone, adresse, créneau. `items_summary` et les notes n'y sont plus.
   - Sécurité : toute valeur de metadata restante est coupée à 500 caractères (champs texte non critiques uniquement ; le panier n'est jamais tronqué).
2. **Webhook Stripe et vérification du paiement (`webhook-stripe`, `verify-payment`)**
   - Lire `session.metadata.draft_id`, charger le brouillon et construire `items_summary` et les notes à partir de celui-ci.
   - Ordre de repli conservé : brouillon, puis lignes Stripe (déjà paginées), puis `cart_backup`, puis l'ancien `metadata.items_summary` (pour les sessions créées avant la mise à jour).
   - Marquer le brouillon comme utilisé et le relier à la commande. Aucune double commande (vérification existante par `stripe_session_id` maintenue).
3. **Inchangé** : facture Stripe, e-mail de confirmation, impression du ticket, affichage admin (toujours basé sur `items_summary`), page de confirmation et vidage du panier.

## Détails techniques
- Migration : `public.checkout_drafts (id uuid pk, restaurant_id uuid, payload jsonb not null, stripe_session_id text, order_id uuid, is_used bool default false, created_at timestamptz default now())`, GRANT ALL à `service_role` uniquement, RLS activée sans policy publique (accès exclusif des fonctions via la clé service).
- `create-checkout` insère le brouillon avec la clé service, crée la session, puis enregistre `stripe_session_id` sur le brouillon.
- Nettoyage : suppression des brouillons non utilisés de plus de 7 jours, dans le même esprit que `cleanup_old_cart_backups`.
- Vérification : test d'un panier de plus de 30 articles (session créée sans erreur 400) et d'un petit panier (comportement identique), puis contrôle de `items_summary` sur la commande créée.
