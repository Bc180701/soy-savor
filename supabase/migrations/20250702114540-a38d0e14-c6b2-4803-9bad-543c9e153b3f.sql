
-- Supprimer la politique existante qui cause le problème circulaire
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;

-- Créer une politique temporaire qui permet l'insertion de rôles administrateur
-- Cette politique vérifie directement dans la table user_roles pour éviter la récursion
CREATE POLICY "Allow admin role creation" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (
    -- Permettre si l'utilisateur est déjà admin OU si c'est le premier admin
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'administrateur'
    ) 
    OR 
    -- Permettre si aucun admin n'existe encore (pour le premier admin)
    NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE role = 'administrateur'
    )
  );

-- Ajouter une politique pour permettre aux super utilisateurs d'insérer des rôles
-- (au cas où nous aurions besoin d'une solution de secours)
CREATE POLICY "Service role can insert any role" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');
