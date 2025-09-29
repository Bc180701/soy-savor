-- Créer simplement la table admin_permissions
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