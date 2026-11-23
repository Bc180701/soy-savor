CREATE TABLE public.automatic_print_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
 enabled boolean NOT NULL DEFAULT true,
 created_at timestamp without time zone NOT NULL DEFAULT timezone('Europe/Paris', now()),
 updated_at timestamp without time zone NOT NULL DEFAULT timezone('Europe/Paris', now())
);
GRANT SELECT ON public.automatic_print_settings TO authenticated;
GRANT UPDATE (enabled) ON public.automatic_print_settings TO authenticated;
GRANT ALL ON public.automatic_print_settings TO service_role;
ALTER TABLE public.automatic_print_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY automatic_print_settings_admin_read ON public.automatic_print_settings FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY automatic_print_settings_admin_update ON public.automatic_print_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY automatic_print_settings_service ON public.automatic_print_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.automatic_print_settings (id, enabled) VALUES (true, true);
CREATE FUNCTION public.touch_automatic_print_settings() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at := timezone('Europe/Paris', now()); RETURN NEW; END; $$;
CREATE TRIGGER touch_automatic_print_settings BEFORE UPDATE ON public.automatic_print_settings FOR EACH ROW EXECUTE FUNCTION public.touch_automatic_print_settings();
REVOKE ALL ON FUNCTION public.touch_automatic_print_settings() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.claim_automatic_print(p_order_id uuid) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_order public.orders; v_claim uuid; v_enabled boolean;
BEGIN
 SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND auto_print_eligible AND payment_status = 'paid' AND stripe_session_id IS NOT NULL AND status NOT IN ('cancelled', 'refunded');
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF jsonb_typeof(v_order.items_summary) <> 'array' OR jsonb_array_length(v_order.items_summary) = 0 THEN RETURN NULL; END IF;
 SELECT enabled INTO v_enabled FROM public.automatic_print_settings WHERE id = true FOR SHARE;
 IF v_enabled IS DISTINCT FROM true THEN
   INSERT INTO public.automatic_print_jobs(order_id, status) VALUES (v_order.id, 'disabled') ON CONFLICT (order_id) DO NOTHING;
   RETURN NULL;
 END IF;
 INSERT INTO public.automatic_print_jobs(order_id) VALUES (v_order.id) ON CONFLICT (order_id) DO NOTHING RETURNING order_id INTO v_claim;
 IF v_claim IS NULL THEN RETURN NULL; END IF;
 RETURN to_jsonb(v_order);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_automatic_print(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_automatic_print(uuid) TO service_role;