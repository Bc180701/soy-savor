-- Partie 2: Créer la table admin_permissions et les fonctions
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

-- Créer les politiques RLS
CREATE POLICY "Super admins can manage all permissions" 
ON public.admin_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'super_administrateur'::user_role));

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
  -- Si l'utilisateur est super_administrateur, il a accès à tout
  SELECT CASE 
    WHEN has_role(user_id, 'super_administrateur'::user_role) THEN true
    -- Si pas de permission spécifique définie, l'admin a accès par défaut
    WHEN NOT EXISTS (
      SELECT 1 FROM public.admin_permissions 
      WHERE admin_user_id = user_id AND section_name = section
    ) THEN true
    -- Sinon, vérifier la permission spécifique
    ELSE (
      SELECT can_access FROM public.admin_permissions 
      WHERE admin_user_id = user_id AND section_name = section
    )
  END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_admin_permissions_updated_at
BEFORE UPDATE ON public.admin_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Assigner le rôle super_administrateur aux utilisateurs spécifiés
DO $$
DECLARE
  anais_id uuid;
  clweb_id uuid;
BEGIN
  -- Récupérer l'ID d'Anais
  SELECT id INTO anais_id FROM auth.users WHERE email = 'anais.remuaux@gmail.com';
  
  -- Récupérer l'ID de clweb
  SELECT id INTO clweb_id FROM auth.users WHERE email = 'clweb@hotmail.com';
  
  -- Assigner le rôle super_administrateur si les utilisateurs existent
  IF anais_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (anais_id, 'super_administrateur'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  IF clweb_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (clweb_id, 'super_administrateur'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;