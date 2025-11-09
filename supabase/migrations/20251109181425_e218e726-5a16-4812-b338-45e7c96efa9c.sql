-- Modifier le timezone par défaut pour les timestamps created_at
-- Cela affectera toutes les nouvelles commandes créées

-- Pour la table orders, utiliser le timezone Europe/Paris pour created_at
ALTER TABLE orders 
ALTER COLUMN created_at SET DEFAULT timezone('Europe/Paris', now());

-- Commentaire: Cela garantit que tous les created_at futurs seront enregistrés 
-- avec l'heure locale française (Europe/Paris) au lieu de UTC