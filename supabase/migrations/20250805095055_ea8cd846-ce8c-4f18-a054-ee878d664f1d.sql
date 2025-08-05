-- Créer une politique RLS pour permettre aux administrateurs d'accéder à auth_users_view
CREATE POLICY "Admins can view all users" 
ON public.auth_users_view 
FOR SELECT 
USING (has_role(auth.uid(), 'administrateur'::user_role));