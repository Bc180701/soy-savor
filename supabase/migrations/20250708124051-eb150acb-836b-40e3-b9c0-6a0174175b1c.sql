-- Corriger la fonction pour utiliser les paramètres SMTP Supabase
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
  
  -- Utiliser l'API native Supabase pour l'envoi d'email
  SELECT * INTO v_response FROM net.http_post(
    url := 'https://api.supabase.com/platform/projects/' || current_setting('app.settings.project_ref', true) || '/email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'to', p_email,
      'subject', v_subject,
      'html', v_content
    )
  );
  
  -- Log pour debug
  RAISE NOTICE 'Email envoyé - Status: %, Response: %', v_response.status, v_response.content;
  
  RETURN v_response.status = 200;
END;
$function$;