CREATE TABLE public.delivery_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  label text NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT (id, restaurant_id, label, is_active, last_used_at, created_at, updated_at) ON public.delivery_access_codes TO authenticated;
GRANT UPDATE (label, is_active) ON public.delivery_access_codes TO authenticated;
GRANT DELETE ON public.delivery_access_codes TO authenticated;
GRANT ALL ON public.delivery_access_codes TO service_role;
ALTER TABLE public.delivery_access_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read delivery codes" ON public.delivery_access_codes FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update delivery codes" ON public.delivery_access_codes FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete delivery codes" ON public.delivery_access_codes FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER update_delivery_access_codes_updated_at BEFORE UPDATE ON public.delivery_access_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.delivery_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  code_id uuid NOT NULL REFERENCES public.delivery_access_codes(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.delivery_sessions TO service_role;
ALTER TABLE public.delivery_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.delivery_admin_create_code(p_restaurant_id uuid, p_label text, p_password text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF length(trim(coalesce(p_label,''))) = 0 THEN RAISE EXCEPTION 'Nom du livreur requis'; END IF;
  IF length(coalesce(p_password,'')) < 4 THEN RAISE EXCEPTION 'Mot de passe trop court (4 caractères minimum)'; END IF;
  INSERT INTO public.delivery_access_codes (restaurant_id, label, password_hash)
  VALUES (p_restaurant_id, trim(p_label), extensions.crypt(p_password, extensions.gen_salt('bf', 8)))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.delivery_admin_create_code(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delivery_admin_create_code(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delivery_login(p_restaurant_id uuid, p_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_code record; v_token text; v_exp timestamptz;
BEGIN
  SELECT * INTO v_code FROM public.delivery_access_codes
   WHERE restaurant_id = p_restaurant_id AND is_active
     AND password_hash = extensions.crypt(coalesce(p_password,''), password_hash)
   LIMIT 1;
  IF v_code.id IS NULL THEN
    PERFORM pg_sleep(0.5);
    RETURN jsonb_build_object('ok', false);
  END IF;
  DELETE FROM public.delivery_sessions WHERE expires_at < now();
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_exp := now() + interval '5 hours';
  INSERT INTO public.delivery_sessions (token_hash, code_id, restaurant_id, expires_at)
  VALUES (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_code.id, p_restaurant_id, v_exp);
  UPDATE public.delivery_access_codes SET last_used_at = now() WHERE id = v_code.id;
  RETURN jsonb_build_object('ok', true, 'token', v_token, 'expires_at', v_exp, 'label', v_code.label);
END $$;
GRANT EXECUTE ON FUNCTION public.delivery_login(uuid,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delivery_session_restaurant(p_token text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT s.restaurant_id FROM public.delivery_sessions s
  JOIN public.delivery_access_codes c ON c.id = s.code_id AND c.is_active
  WHERE s.token_hash = encode(extensions.digest(coalesce(p_token,''), 'sha256'), 'hex')
    AND s.expires_at > now()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.delivery_session_restaurant(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.delivery_get_orders(p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid; v_today date;
BEGIN
  v_rest := public.delivery_session_restaurant(p_token);
  IF v_rest IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  v_today := (now() AT TIME ZONE 'Europe/Paris')::date;
  RETURN jsonb_build_object('ok', true, 'restaurant_id', v_rest, 'orders', coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', o.id, 'status', o.status, 'scheduled_for', o.scheduled_for,
      'client_name', o.client_name, 'client_phone', o.client_phone,
      'delivery_street', o.delivery_street, 'delivery_city', o.delivery_city,
      'delivery_postal_code', o.delivery_postal_code,
      'delivery_instructions', o.delivery_instructions, 'customer_notes', o.customer_notes,
      'total', o.total, 'payment_method', o.payment_method, 'payment_status', o.payment_status,
      'items_summary', o.items_summary
    ) ORDER BY o.scheduled_for)
    FROM public.orders o
    WHERE o.restaurant_id = v_rest AND o.order_type = 'delivery'
      AND o.scheduled_for::date = v_today
      AND o.status <> 'cancelled' AND o.payment_status = 'paid'
  ), '[]'::jsonb));
END $$;
GRANT EXECUTE ON FUNCTION public.delivery_get_orders(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delivery_update_status(p_token text, p_order_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid; v_count int;
BEGIN
  v_rest := public.delivery_session_restaurant(p_token);
  IF v_rest IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'session'); END IF;
  IF p_status NOT IN ('out-for-delivery','delivered') THEN RETURN jsonb_build_object('ok', false, 'reason', 'status'); END IF;
  UPDATE public.orders SET status = p_status
   WHERE id = p_order_id AND restaurant_id = v_rest AND order_type = 'delivery' AND status <> 'cancelled';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', v_count = 1);
END $$;
GRANT EXECUTE ON FUNCTION public.delivery_update_status(text,uuid,text) TO anon, authenticated;