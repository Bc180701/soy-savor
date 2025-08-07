-- Activer RLS sur les tables qui en ont besoin
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Créer des politiques simples pour ces tables
CREATE POLICY "Push tokens are public" ON public.push_tokens FOR ALL USING (true);