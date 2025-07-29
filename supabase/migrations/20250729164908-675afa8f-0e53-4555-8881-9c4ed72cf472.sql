-- Créer la table admin_permissions
CREATE TABLE public.admin_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  section_name text NOT NULL,
  can_access boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid NOT NULL,
  UNIQUE(admin_user_id, section_name)
);

-- Activer RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Créer une fonction simple pour vérifier le rôle super admin
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

-- Créer les politiques RLS utilisant cette fonction
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE 
    WHEN is_super_admin(user_id) THEN true
    WHEN NOT EXISTS (
      SELECT 1 FROM public.admin_permissions 
      WHERE admin_user_id = user_id AND section_name = section
    ) THEN true
    ELSE COALESCE((
      SELECT can_access FROM public.admin_permissions 
      WHERE admin_user_id = user_id AND section_name = section
    ), true)
  END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_admin_permissions_updated_at
BEFORE UPDATE ON public.admin_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Assigner le rôle super_administrateur aux utilisateurs spécifiés
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'super_administrateur'
FROM auth.users 
WHERE email IN ('anais.remuaux@gmail.com', 'clweb@hotmail.com')
AND id NOT IN (
  SELECT user_id FROM public.user_roles 
  WHERE role::text = 'super_administrateur'
);