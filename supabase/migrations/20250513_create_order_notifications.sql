
-- Create order notifications table to store emails sent to customers
CREATE TABLE IF NOT EXISTS public.order_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL, 
  content TEXT NOT NULL,
  status_update TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add comments for better documentation
COMMENT ON TABLE public.order_notifications IS 'Records of notifications sent to customers';
COMMENT ON COLUMN public.order_notifications.order_id IS 'Reference to the order';
COMMENT ON COLUMN public.order_notifications.recipient_email IS 'Email address of the recipient';
COMMENT ON COLUMN public.order_notifications.subject IS 'Subject line of the email';
COMMENT ON COLUMN public.order_notifications.content IS 'HTML content of the email';
COMMENT ON COLUMN public.order_notifications.status_update IS 'The status update that triggered this notification';

-- Add Row Level Security (RLS)
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

-- Allow administrators to access all notifications
CREATE POLICY "Admins can access all notifications"
  ON public.order_notifications
  FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM public.admin_users
    WHERE role = 'administrateur'
  ));
