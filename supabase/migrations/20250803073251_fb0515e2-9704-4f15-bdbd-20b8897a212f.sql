-- Ajouter le champ pour le numéro de téléphone du livreur dans la table restaurants
ALTER TABLE public.restaurants 
ADD COLUMN delivery_phone TEXT;