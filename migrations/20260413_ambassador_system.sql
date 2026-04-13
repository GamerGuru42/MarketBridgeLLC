-- AMBASSADOR TRACKING SYSTEM (APRIL 2026)
-- Supporting the "Vanguard" Campus Leaders program

BEGIN;

CREATE TABLE IF NOT EXISTS public.ambassador_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    full_name TEXT NOT NULL,
    university TEXT NOT NULL,
    student_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    experience TEXT,
    social_handle TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

-- Policies for Ambassador Applications
CREATE POLICY "Users can view their own applications" 
    ON public.ambassador_applications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own application" 
    ON public.ambassador_applications FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all applications" 
    ON public.ambassador_applications FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('ceo', 'ops_admin', 'tech_admin', 'marketing_admin')
    ));

-- Create trigger for updated_at
CREATE TRIGGER update_ambassador_applications_updated_at
BEFORE UPDATE ON public.ambassador_applications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
