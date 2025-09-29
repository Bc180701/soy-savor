-- Enable RLS on sushi_ingredients and poke_ingredients tables
-- This was the root cause of the 403 errors

ALTER TABLE public.sushi_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poke_ingredients ENABLE ROW LEVEL SECURITY;