-- Add stripe_receipt_url column to orders table
ALTER TABLE public.orders 
ADD COLUMN stripe_receipt_url TEXT;