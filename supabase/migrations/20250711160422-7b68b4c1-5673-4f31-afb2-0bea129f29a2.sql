
-- Add missing columns to day_based_promotions table
ALTER TABLE public.day_based_promotions 
ADD COLUMN IF NOT EXISTS applicable_products text[],
ADD COLUMN IF NOT EXISTS applicable_restaurants text[];
