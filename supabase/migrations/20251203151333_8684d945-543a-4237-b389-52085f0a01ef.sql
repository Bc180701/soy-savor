-- Table pour gérer les événements spéciaux (Noël, Saint-Valentin, etc.)
CREATE TABLE public.special_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  event_date DATE NOT NULL,
  preorder_start DATE NOT NULL,
  preorder_end DATE NOT NULL,
  restrict_menu_on_event BOOLEAN DEFAULT true,
  allowed_categories TEXT[] DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour lier les produits aux événements
CREATE TABLE public.event_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.special_events(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, product_id)
);

-- Enable RLS
ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_products ENABLE ROW LEVEL SECURITY;

-- Policies for special_events
CREATE POLICY "Anyone can view active special events" 
ON public.special_events 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage special events" 
ON public.special_events 
FOR ALL 
USING (has_role(auth.uid(), 'administrateur'::user_role));

-- Policies for event_products
CREATE POLICY "Anyone can view event products" 
ON public.event_products 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage event products" 
ON public.event_products 
FOR ALL 
USING (has_role(auth.uid(), 'administrateur'::user_role));

-- Trigger pour updated_at
CREATE TRIGGER update_special_events_updated_at
BEFORE UPDATE ON public.special_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();