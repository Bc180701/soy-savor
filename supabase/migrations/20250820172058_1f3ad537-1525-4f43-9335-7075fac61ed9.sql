-- Supprimer le rôle administrateur en doublon pour anais.remuaux@gmail.com
-- On garde seulement le rôle super_administrateur qui est plus récent et plus élevé

DELETE FROM public.user_roles 
WHERE id = 'debba86d-4f7a-4374-a908-359960900320' 
AND user_id = 'e6de9091-8415-41d8-9bf7-e915f75a5e57' 
AND role = 'administrateur';