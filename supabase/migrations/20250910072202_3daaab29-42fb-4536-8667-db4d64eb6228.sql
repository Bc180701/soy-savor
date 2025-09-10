-- Enable RLS on tables that need it
ALTER TABLE public.sushi_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poke_ingredients ENABLE ROW LEVEL SECURITY;