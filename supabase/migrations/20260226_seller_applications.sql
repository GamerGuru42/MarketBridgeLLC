-- Create the seller applications table
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    university TEXT NOT NULL,
    student_email TEXT NOT NULL UNIQUE,
    sell_categories TEXT[] NOT NULL,
    items_ready TEXT NOT NULL,
    id_card_url TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (anyone can apply)
CREATE POLICY "Anyone can submit seller application" ON public.seller_applications
FOR INSERT WITH CHECK (true);

-- Only admins/CEO/operations can view or update
CREATE POLICY "Admins can view and update applications" ON public.seller_applications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND (users.role IN ('admin', 'ceo', 'operations_admin', 'technical_admin'))
  )
);
