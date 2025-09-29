-- Activer RLS sur les tables qui en ont besoin
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Créer des politiques simples pour ces tables
CREATE POLICY "Anyone can view time slots" ON public.time_slots FOR SELECT USING (true);
CREATE POLICY "Anyone can view delivery zones" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Push tokens are public" ON public.push_tokens FOR ALL USING (true);