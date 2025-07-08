-- Corriger la fonction pour utiliser l'envoi d'email SMTP Supabase
CREATE OR REPLACE FUNCTION public.send_order_status_email(p_email text, p_name text, p_order_id text, p_status text, p_status_message text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_subject TEXT;
  v_content TEXT;
  v_response record;
BEGIN
  -- Définir le sujet de l'email
  v_subject := 'Mise à jour de votre commande #' || p_order_id;
  
  -- Créer le contenu de l'email
  v_content := '<html><body>';
  v_content := v_content || '<h1>Mise à jour de votre commande</h1>';
  v_content := v_content || '<p>Bonjour ' || p_name || ',</p>';
  v_content := v_content || '<p>Nous vous informons que votre commande <strong>#' || p_order_id || '</strong> ' || p_status_message || '.</p>';
  v_content := v_content || '<p>Statut actuel: <strong>' || p_status || '</strong></p>';
  v_content := v_content || '<p>Merci de nous faire confiance !</p>';
  v_content := v_content || '<p>L''équipe SushiEats</p>';
  v_content := v_content || '</body></html>';
  
  -- Utiliser l'API email intégrée de Supabase avec auth.email()
  SELECT * INTO v_response FROM auth.email(
    p_email,  -- to
    v_subject, -- subject
    v_content  -- body
  );
  
  -- Log pour debug
  RAISE NOTICE 'Email envoyé via auth.email() - Response: %', v_response;
  
  RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur envoi email: %', SQLERRM;
        RETURN FALSE;
END;
$function$;