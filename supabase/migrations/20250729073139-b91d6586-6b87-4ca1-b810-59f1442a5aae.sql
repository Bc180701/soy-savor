-- Ajouter une table pour contrôler la visibilité des sections de produits mis en avant
CREATE TABLE IF NOT EXISTS public.featured_products_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_nouveautes BOOLEAN NOT NULL DEFAULT true,
  show_populaires BOOLEAN NOT NULL DEFAULT true,
  show_exclusivites BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_products_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage settings
CREATE POLICY "Admins can manage featured products settings"
ON public.featured_products_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrateur'
  )
);

-- Insert default settings if none exist
INSERT INTO public.featured_products_settings (show_nouveautes, show_populaires, show_exclusivites)
SELECT true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.featured_products_settings);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_featured_products_settings_updated_at
BEFORE UPDATE ON public.featured_products_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();