-- Supprimer l'ancienne fonction d'envoi d'email
DROP FUNCTION IF EXISTS public.send_order_status_email(text, text, text, text, text);

-- Créer un trigger pour envoyer automatiquement des notifications lors des changements de statut
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_email TEXT;
  customer_name TEXT;
BEGIN
  -- Vérifier si le statut a changé
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Récupérer les informations client
    customer_email := COALESCE(NEW.client_email, (SELECT email FROM auth.users WHERE id = NEW.user_id));
    customer_name := COALESCE(NEW.client_name, 'Client');
    
    -- Envoyer la notification uniquement si on a un email
    IF customer_email IS NOT NULL THEN
      -- Log pour debug
      RAISE NOTICE 'Commande % - Changement de statut: % -> %, Email: %', 
        NEW.id, OLD.status, NEW.status, customer_email;
      
      -- L'envoi réel sera géré par l'application frontend
      -- Ici on ne fait que logger le changement
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table orders
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();