ALTER TABLE public.orders ADD COLUMN auto_print_eligible boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ALTER COLUMN auto_print_eligible SET DEFAULT true;
CREATE TABLE public.automatic_print_jobs (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sending',
  error_code text,
  created_at timestamp without time zone NOT NULL DEFAULT timezone('Europe/Paris', now()),
  updated_at timestamp without time zone NOT NULL DEFAULT timezone('Europe/Paris', now())
);
GRANT ALL ON public.automatic_print_jobs TO service_role;
ALTER TABLE public.automatic_print_jobs ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.touch_automatic_print_job() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := timezone('Europe/Paris', now()); RETURN NEW; END;
$$;
CREATE TRIGGER touch_automatic_print_job BEFORE UPDATE ON public.automatic_print_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_automatic_print_job();
CREATE FUNCTION public.claim_automatic_print(p_order_id uuid) RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_order public.orders; v_claim uuid;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND auto_print_eligible AND payment_status = 'paid' AND stripe_session_id IS NOT NULL AND status NOT IN ('cancelled', 'refunded');
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF jsonb_typeof(v_order.items_summary) <> 'array' OR jsonb_array_length(v_order.items_summary) = 0 THEN RETURN NULL; END IF;
  INSERT INTO public.automatic_print_jobs(order_id) VALUES (v_order.id) ON CONFLICT (order_id) DO NOTHING RETURNING order_id INTO v_claim;
  IF v_claim IS NULL THEN RETURN NULL; END IF;
  RETURN to_jsonb(v_order);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_automatic_print(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_automatic_print(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.touch_automatic_print_job() FROM PUBLIC, anon, authenticated;