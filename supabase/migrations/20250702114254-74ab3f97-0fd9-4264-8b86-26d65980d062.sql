
-- Activer RLS sur la table user_roles si ce n'est pas déjà fait
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre aux administrateurs d'insérer des rôles
CREATE POLICY "Admins can insert user roles" 
  ON public.user_roles 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'administrateur'));

-- Créer une politique pour permettre aux administrateurs de voir tous les rôles
CREATE POLICY "Admins can view all user roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (has_role(auth.uid(), 'administrateur'));

-- Créer une politique pour permettre aux administrateurs de supprimer des rôles
CREATE POLICY "Admins can delete user roles" 
  ON public.user_roles 
  FOR DELETE 
  USING (has_role(auth.uid(), 'administrateur'));
