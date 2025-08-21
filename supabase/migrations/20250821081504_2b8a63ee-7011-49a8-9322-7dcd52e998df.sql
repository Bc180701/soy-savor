-- Create function to update restaurant settings
CREATE OR REPLACE FUNCTION public.update_restaurant_settings(
  restaurant_id uuid,
  new_settings jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.restaurants 
  SET settings = new_settings, updated_at = now()
  WHERE id = restaurant_id;
END;
$$;