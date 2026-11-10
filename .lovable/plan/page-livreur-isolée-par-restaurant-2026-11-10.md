# Page Livreur isolée par restaurant

## Ce que verront les clients
- **Une page par restaurant** : `/livraison/chateaurenard` et `/livraison/saint-martin-de-crau`. Pas de menu admin, pas de tableau de bord : uniquement la vue Livraison actuelle (adresses, Waze/Plans, appel client, statut « En livraison » / « Livrée », retards signalés).
- **Écran mot de passe** à l'ouverture. Une fois saisi, le livreur reste connecté **5 h** sur ce téléphone, même s'il ferme l'onglet.
- **Accès coupé immédiatement** si l'admin supprime ou désactive le mot de passe (vérifié à chaque actualisation, toutes les 30 s environ) : retour à l'écran mot de passe.
- Chaque page n'affiche **que les commandes de son restaurant**, livraisons du jour, actualisation automatique.
- **Pensé téléphone** : grandes cartes, gros boutons, une main, pas de zoom ; ajout possible à l'écran d'accueil.

## Côté admin : nouvel onglet « Page livraison »
- Lien de la page du restaurant (bouton copier) + QR code optionnel.
- Liste des mots de passe : nom du livreur, date de création, dernière utilisation, interrupteur Actif/Désactivé, bouton Supprimer.
- Bouton « Ajouter un mot de passe » (nom du livreur + mot de passe, ou génération automatique), illimité.
- Les mots de passe ne sont jamais réaffichés après création (stockés chiffrés).

## Détails techniques
- Table `delivery_access_codes` (restaurant_id, label, password_hash bcrypt, is_active, last_used_at) ; table `delivery_sessions` (token haché, code_id, restaurant_id, expires_at = +5 h). RLS : gestion réservée à `is_admin()`, aucun accès anonyme direct.
- Edge function `delivery-portal` : `login` (vérifie le mot de passe, crée la session), `orders` (vérifie session valide + code toujours actif, renvoie les commandes livraison du restaurant via service role, uniquement les champs nécessaires), `update-status` (limité à ready → out-for-delivery → delivered).
- Le jeton est gardé dans le navigateur du livreur ; supprimer/désactiver le code invalide toutes ses sessions côté serveur.
- Réutilisation de `OrdersDeliveryView` (adaptée mobile) dans une nouvelle route publique hors `Admin.tsx`.
- Tests : expiration à 5 h, refus après désactivation/suppression, isolation par restaurant.
