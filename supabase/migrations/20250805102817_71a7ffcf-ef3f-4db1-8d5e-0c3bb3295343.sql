-- Créer une table pour les codes promo
CREATE TABLE IF NOT EXISTS public.promotion_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_limit INTEGER NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insérer le code promo de bienvenue
INSERT INTO public.promotion_codes (code, discount_percentage, is_active, usage_limit)
VALUES ('BIENVENUE', 10, true, NULL)
ON CONFLICT (code) DO NOTHING;

-- Créer une table pour suivre l'utilisation des codes promo par utilisateur
CREATE TABLE IF NOT EXISTS public.user_promotion_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  promotion_code TEXT NOT NULL REFERENCES public.promotion_codes(code),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_id UUID NULL,
  UNIQUE(user_email, promotion_code)
);

-- Activer RLS
ALTER TABLE public.promotion_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promotion_usage ENABLE ROW LEVEL SECURITY;

-- Politique pour les codes promo (tout le monde peut voir les codes actifs)
CREATE POLICY "Everyone can view active promotion codes" 
ON public.promotion_codes 
FOR SELECT 
USING (is_active = true);

-- Politique pour l'usage des promotions (chacun peut voir ses propres usages)
CREATE POLICY "Users can view their own promotion usage" 
ON public.user_promotion_usage 
FOR SELECT 
USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Politique pour insérer l'usage (chacun peut insérer pour son email)
CREATE POLICY "Users can insert their own promotion usage" 
ON public.user_promotion_usage 
FOR INSERT 
WITH CHECK (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_promotion_codes_updated_at
BEFORE UPDATE ON public.promotion_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();