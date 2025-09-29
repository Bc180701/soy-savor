-- Créer une table pour les créneaux bloqués par restaurant
CREATE TABLE public.blocked_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  blocked_date DATE NOT NULL,
  blocked_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte unique pour éviter les doublons
  UNIQUE(restaurant_id, blocked_date, blocked_time)
);

-- Enable RLS
ALTER TABLE public.blocked_time_slots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage blocked time slots" 
ON public.blocked_time_slots 
FOR ALL 
USING (has_role(auth.uid(), 'administrateur'::user_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blocked_time_slots_updated_at
BEFORE UPDATE ON public.blocked_time_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();