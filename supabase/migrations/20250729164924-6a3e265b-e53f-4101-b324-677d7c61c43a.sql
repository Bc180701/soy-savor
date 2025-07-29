-- Créer d'abord la fonction simple pour vérifier le rôle super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = is_super_admin.user_id 
    AND role::text = 'super_administrateur'
  );
$$;