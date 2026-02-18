-- COMPREHENSIVE INFRASTRUCTURE RECOVERY & INITIALIZATION
-- Run this script in the Supabase SQL Editor to fix admin chats, 
-- initialize real-time pulses, and setup secure channels.

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Initialize/Fix Essential Admin Tables
CREATE TABLE IF NOT EXISTS public.admin_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('public', 'private')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADD MISSING COLUMNS to admin_channels if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_channels' AND column_name='label') THEN
        ALTER TABLE public.admin_channels ADD COLUMN label TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_channels' AND column_name='is_dm') THEN
        ALTER TABLE public.admin_channels ADD COLUMN is_dm BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_channel_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    channel_id TEXT REFERENCES public.admin_channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT, -- Cached role for performance
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
-- PART 4: Proposals/Memos System (Secure)
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

-- Drop standard policies
DROP POLICY IF EXISTS "Admins can view all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins/CEO can view all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins/CEO can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins/CEO can update proposals" ON public.proposals;

-- NEW: Tie Proposals to Admin/CEO roles specifically
CREATE POLICY "Admins/CEO can view all proposals" ON public.proposals 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder')
        )
    );

CREATE POLICY "Admins/CEO can create proposals" ON public.proposals 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder')
        )
    );

CREATE POLICY "Admins/CEO can update proposals" ON public.proposals 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'ceo', 'cofounder')
        )
    );

-- ========================================
-- PART 5: Initialize Admin Channels & Realtime
-- ========================================

INSERT INTO public.admin_channels (id, name, label, type, is_dm) VALUES
('gen', 'general-ops', 'General Ops', 'public', FALSE),
('strat', 'ceo-strategy', 'CEO Strategy', 'private', FALSE),
('tech', 'tech-signals', 'Tech Signals', 'public', FALSE),
('abj', 'ops-abuja', 'Abuja Node', 'public', FALSE),
('ceo-direct', 'ceo-direct', 'CEO Direct', 'private', TRUE),
('cto-hub', 'cto-hub', 'CTO Hub', 'private', TRUE)
ON CONFLICT (id) DO UPDATE SET 
    label = EXCLUDED.label,
    is_dm = EXCLUDED.is_dm;

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- Add tables to the publication
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE admin_channel_messages; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE admin_channels; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE messages; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE conversations; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE escrow_agreements; EXCEPTION WHEN others THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE escrow_steps; EXCEPTION WHEN others THEN NULL; END;
END $$;
