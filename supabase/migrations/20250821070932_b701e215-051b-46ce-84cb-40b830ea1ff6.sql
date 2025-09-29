-- Supprimer tous les rôles admin sauf pour clweb@hotmail.com
DELETE FROM public.user_roles 
WHERE role IN ('administrateur', 'super_administrateur') 
AND user_id != '3471ed9e-fe18-4838-af2a-11629c37e57d';

-- S'assurer que clweb@hotmail.com a seulement le rôle super_administrateur
DELETE FROM public.user_roles 
WHERE user_id = '3471ed9e-fe18-4838-af2a-11629c37e57d' 
AND role = 'administrateur';

-- Vérifier que clweb@hotmail.com a bien le rôle super_administrateur
INSERT INTO public.user_roles (user_id, role)
SELECT '3471ed9e-fe18-4838-af2a-11629c37e57d', 'super_administrateur'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '3471ed9e-fe18-4838-af2a-11629c37e57d' 
  AND role = 'super_administrateur'
);