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

-- Créer les politiques RLS avec cast explicite
CREATE POLICY "Super admins can manage all permissions" 
ON public.admin_permissions 
FOR ALL 
USING (has_role(auth.uid(), CAST('super_administrateur' AS user_role)));

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
    WHEN has_role(user_id, CAST('super_administrateur' AS user_role)) THEN true
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
SELECT id, CAST('super_administrateur' AS user_role)
FROM auth.users 
WHERE email IN ('anais.remuaux@gmail.com', 'clweb@hotmail.com')
ON CONFLICT (user_id, role) DO NOTHING;