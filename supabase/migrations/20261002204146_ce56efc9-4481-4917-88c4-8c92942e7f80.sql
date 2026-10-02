CREATE OR REPLACE FUNCTION public.get_occupied_slots(p_restaurant_id uuid, p_start timestamptz, p_end timestamptz)
RETURNS TABLE(scheduled_for timestamp without time zone, order_type text, payment_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT o.scheduled_for, o.order_type, o.payment_status
  FROM public.orders o
  WHERE o.restaurant_id = p_restaurant_id
    AND o.scheduled_for >= p_start::timestamp
    AND o.scheduled_for < p_end::timestamp
    AND o.payment_status IN ('paid','pending');
$$;
GRANT EXECUTE ON FUNCTION public.get_occupied_slots(uuid, timestamptz, timestamptz) TO anon, authenticated, service_role;