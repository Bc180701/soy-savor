-- Add banner customization fields to special_events table
ALTER TABLE public.special_events 
ADD COLUMN IF NOT EXISTS banner_title TEXT,
ADD COLUMN IF NOT EXISTS banner_description TEXT;