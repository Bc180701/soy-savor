-- Créer une politique RLS pour permettre aux administrateurs de voir les utilisateurs
CREATE POLICY "Admins can view all users" 
ON public.auth_users_view 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'administrateur'::user_role));