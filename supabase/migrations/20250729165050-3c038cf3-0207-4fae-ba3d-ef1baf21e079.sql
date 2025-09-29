-- Ajouter les politiques RLS pour admin_permissions
CREATE POLICY "Super admins can manage all permissions" 
ON public.admin_permissions 
FOR ALL 
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their own permissions" 
ON public.admin_permissions 
FOR SELECT 
USING (admin_user_id = auth.uid());

-- Fonction pour vérifier si un admin peut accéder à une section
CREATE OR REPLACE FUNCTION public.can_access_admin_section(user_id uuid, section text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Si l'utilisateur est super_administrateur, il a accès à tout
  IF is_super_admin(user_id) THEN 
    RETURN true;
  END IF;
  
  -- Si pas de permission spécifique définie, l'admin a accès par défaut
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_permissions 
    WHERE admin_user_id = user_id AND section_name = section
  ) THEN 
    RETURN true;
  END IF;
  
  -- Sinon, vérifier la permission spécifique
  RETURN COALESCE((
    SELECT can_access FROM public.admin_permissions 
    WHERE admin_user_id = user_id AND section_name = section
  ), true);
END;
$$;