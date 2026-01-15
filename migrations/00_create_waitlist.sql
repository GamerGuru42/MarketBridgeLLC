-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    phone TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since it's a public waitlist)
CREATE POLICY "Allow public insert to waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);
    
-- Only admins can view waitlist
CREATE POLICY "Admins can view waitlist" ON public.waitlist
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.users WHERE role IN ('admin', 'ceo', 'cofounder', 'cto', 'coo')
        )
    );
