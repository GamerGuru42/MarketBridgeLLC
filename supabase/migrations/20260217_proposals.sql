-- PROPOSALS / MEMOS SYSTEM
-- Allows admins/staff to submit strategic proposals to the CEO

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('operations', 'technical', 'marketing', 'financial', 'security')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    impact TEXT, -- Optional (e.g., "+15% growth")
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON public.proposals(created_at DESC);

-- RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Policies
-- Admins can view all, create, update
CREATE POLICY "Admins can view all proposals" ON public.proposals
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can create proposals" ON public.proposals
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can update proposals" ON public.proposals
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Realtime
-- ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
