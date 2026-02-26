-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts to the waitlist
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
FOR INSERT WITH CHECK (true);

-- Only admins/CEO can view the waitlist
CREATE POLICY "Admins can view waitlist" ON public.waitlist
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (users.role IN ('admin', 'ceo', 'technical_admin', 'operations_admin', 'marketing_admin'))
  )
);
