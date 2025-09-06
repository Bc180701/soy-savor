-- Enable RLS on restaurants_info and restaurants_info_hours tables
ALTER TABLE public.restaurants_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants_info_hours ENABLE ROW LEVEL SECURITY;