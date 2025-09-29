-- Supprimer la table admin_permissions
DROP TABLE IF EXISTS public.admin_permissions;

-- Supprimer la fonction can_access_admin_section
DROP FUNCTION IF EXISTS public.can_access_admin_section(uuid, text);