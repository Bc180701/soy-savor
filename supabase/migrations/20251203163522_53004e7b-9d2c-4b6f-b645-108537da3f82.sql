-- Add image_url column to special_events table for event banners
ALTER TABLE public.special_events 
ADD COLUMN IF NOT EXISTS image_url text;