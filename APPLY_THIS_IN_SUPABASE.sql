-- COMPREHENSIVE INFRASTRUCTURE RECOVERY & INITIALIZATION
-- Run this script in the Supabase SQL Editor to fix admin chats, 
-- initialize real-time pulses, and setup secure channels.

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Initialize Essential Admin Tables (If missing)
CREATE TABLE IF NOT EXISTS public.admin_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_channel_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id TEXT REFERENCES public.admin_channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PART 1: Auto-Verify Admin & CEO Accounts
-- ========================================

-- Drop and recreate the auto-verification function
DROP TRIGGER IF EXISTS on_auto_verify_accounts ON public.users;
DROP FUNCTION IF EXISTS public.auto_verify_accounts();

CREATE OR REPLACE FUNCTION public.auto_verify_accounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-verify:
    -- 1. @marketbridge.com.ng emails (staff/internal)
    -- 2. CEO and all admin roles
    IF NEW.email ILIKE '%@marketbridge.com.ng' OR
       NEW.role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'cofounder') THEN
        
        UPDATE public.users 
        SET is_verified = TRUE, beta_status = 'approved'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auto_verify_accounts
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_verify_accounts();

-- ========================================
-- PART 2: Secure Admin Chat RLS Policies
-- ========================================

ALTER TABLE public.admin_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_channel_messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view messages" ON admin_channel_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON admin_channel_messages;
DROP POLICY IF EXISTS "Admins can view channels" ON admin_channels;

-- Admin View Policy (Messages)
CREATE POLICY "Admins can view messages" ON admin_channel_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder')
        )
    );

-- Admin Insert Policy (Messages)
CREATE POLICY "Admins can insert messages" ON admin_channel_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder')
        )
    );

-- Admin View Policy (Channels)
CREATE POLICY "Admins can view channels" ON admin_channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder')
        )
    );

-- ========================================
-- PART 3: Retroactive Admin Verification
-- ========================================

UPDATE public.users
SET is_verified = TRUE, beta_status = 'approved'
WHERE role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'cofounder')
AND is_verified = FALSE;

-- ========================================
-- PART 4: Proposals/Memos System
-- ========================================

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Infrastructure Upgrade', 'Policy/Operations Shift', 'Marketing Initiative', 'Financial/Escrow Change', 'Dealer Growth Strategy')),
    priority TEXT NOT NULL CHECK (priority IN ('Low - Optimization', 'Medium - Routine Growth', 'High - Critical Scaling', 'Immediate - Urgent Fix')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    impact TEXT, 
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON public.proposals(created_at DESC);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can update proposals" ON public.proposals;

CREATE POLICY "Admins can view all proposals" ON public.proposals FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can create proposals" ON public.proposals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update proposals" ON public.proposals FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================
-- PART 5: Initialize Admin Channels & Realtime
-- ========================================

INSERT INTO public.admin_channels (id, name, type) VALUES
('gen', 'general-ops', 'public'),
('strat', 'ceo-strategy', 'private'),
('tech', 'tech-signals', 'public'),
('abj', 'ops-abuja', 'public'),
('ceo-direct', 'ceo-direct', 'private'),
('cto-hub', 'cto-hub', 'private')
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- Add tables to the publication
    -- We use separate BEGIN blocks to ignore errors if a table is already in the publication
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE admin_channel_messages; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE admin_channels; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE messages; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE conversations; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE escrow_agreements; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE escrow_steps; EXCEPTION WHEN others THEN NULL; END;
END $$;
