-- Fix RLS policies for special_events - admins need to see ALL events, not just active ones

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active special events" ON public.special_events;
DROP POLICY IF EXISTS "Admins can manage special events" ON public.special_events;

-- Create new policies
CREATE POLICY "Anyone can view active special events" 
ON public.special_events 
FOR SELECT 
USING (is_active = true OR has_role(auth.uid(), 'administrateur'::user_role));

CREATE POLICY "Admins can insert special events" 
ON public.special_events 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'administrateur'::user_role));

CREATE POLICY "Admins can update special events" 
ON public.special_events 
FOR UPDATE 
USING (has_role(auth.uid(), 'administrateur'::user_role));

CREATE POLICY "Admins can delete special events" 
ON public.special_events 
FOR DELETE 
USING (has_role(auth.uid(), 'administrateur'::user_role));