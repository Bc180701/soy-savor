
-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Allow admin role creation" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can insert any role" ON public.user_roles;

-- Créer une politique qui permet la création du premier admin
-- ou permet aux admins existants de créer d'autres admins
CREATE POLICY "Allow admin role creation" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (
    -- Permettre si aucun admin n'existe encore (pour le premier admin)
    NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE role = 'administrateur'
    )
    OR 
    -- Permettre si l'utilisateur connecté est déjà admin
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'administrateur'
    )
  );

-- Politique pour le service role (solution de secours)
CREATE POLICY "Service role can insert any role" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');
