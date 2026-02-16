-- MarketBridge Campus Beta Configuration
-- Date: 2026-02-16
-- Purpose: Setup RBAC, Beta Plans, Referral System, and Compliance

-- ============================================
-- 1. SCHEMA & USER UPDATES
-- ============================================

-- Ensure the public.users table exists (mirroring auth.users)
-- We check if it exists first. If it does, we just ensure the column exists.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure the role column exists in public.users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN 
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'customer'; 
    END IF; 
END $$;

-- Update the constraint for valid roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN (
    'customer', 'student_buyer', 
    'dealer', 'student_seller', 
    'admin', 'super_admin', 'ceo', 'cofounder',
    'technical_admin', 'operations_admin', 'marketing_admin'
));

-- Add university and beta fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS beta_status TEXT CHECK (beta_status IN ('pending', 'approved', 'rejected', 'founding_seller')),
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id);

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- ============================================
-- 2. BETA SUBSCRIPTION PLAN
-- ============================================

-- Ensure subscription_plans table exists (in case it's a fresh setup)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC DEFAULT 0,
    price_annual NUMERIC DEFAULT 0,
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deactivate old plans
UPDATE subscription_plans SET is_active = FALSE WHERE id IN ('campus_starter', 'campus_pro');

-- Insert the Official Beta Plan (1000 NGN)
INSERT INTO subscription_plans (id, name, description, price_monthly, price_annual, features, limits, sort_order, is_active)
VALUES (
    'beta_campus_founder', 
    'Founding Seller (Beta)', 
    'Exclusive rate for the first 100 verified student sellers.', 
    1000, 
    10000, 
    '["Unlimited Listings", "Beta Badge", "Direct Ops Support", "Priority Search Ranking"]',
    '{"max_listings": 50, "priority_support": true, "beta_access": true}',
    1,
    TRUE
) ON CONFLICT (id) DO UPDATE SET 
    price_monthly = 1000,
    is_active = TRUE;

-- ============================================
-- 3. REFERRAL SYSTEM (Ambassador Program)
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id),
    referred_user_id UUID NOT NULL REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'converted_to_paid')),
    reward_eligible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(referred_user_id) -- Only one referrer per user
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- ============================================
-- 4. SELLER FEEDBACK (7-Day Survey)
-- ============================================

CREATE TABLE IF NOT EXISTS seller_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    nps_score INTEGER CHECK (nps_score BETWEEN 0 AND 10),
    comments TEXT,
    features_requested TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. AUDIT LOGS (For Tech Admin)
-- ============================================

CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.users(id), -- Admin who performed action
    action_type TEXT NOT NULL, -- 'approve_seller', 'suspend_user', 'config_change'
    resource_id UUID, -- ID of affected record
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON system_audit_logs(created_at DESC);

-- ============================================
-- 6. UPDATED RLS POLICIES FOR ADMINS
-- ============================================

-- Create a helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_of_type(required_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
    
    -- Super admins, CEOs, etc have access to everything
    IF user_role IN ('admin', 'super_admin', 'ceo', 'cofounder') THEN
        RETURN TRUE;
    END IF;

    -- Specific RBAC checks
    IF required_type = 'technical' AND user_role = 'technical_admin' THEN RETURN TRUE; END IF;
    IF required_type = 'operations' AND user_role = 'operations_admin' THEN RETURN TRUE; END IF;
    IF required_type = 'marketing' AND user_role = 'marketing_admin' THEN RETURN TRUE; END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure subscriptions table exists
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    plan_id TEXT REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Policies for Subscriptions using the new check
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view all subscriptions" ON subscriptions;
CREATE POLICY "Admins view all subscriptions" ON subscriptions 
FOR ALL USING (
    public.is_admin_of_type('technical') OR 
    public.is_admin_of_type('operations') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'ceo', 'cofounder'))
);

-- Policies for Referrals (Marketing Admin)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Marketing views referrals" ON referrals;
CREATE POLICY "Marketing views referrals" ON referrals
FOR ALL USING (
    public.is_admin_of_type('marketing') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'ceo', 'cofounder')) OR
    auth.uid() = referrer_id
);

-- Policies for Audit Logs (Tech Admin)
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tech admins view logs" ON system_audit_logs;
CREATE POLICY "Tech admins view logs" ON system_audit_logs
FOR SELECT USING (
    public.is_admin_of_type('technical') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'ceo', 'cofounder'))
);

-- Policies for Feedback (Ops Admin)
ALTER TABLE seller_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ops views feedback" ON seller_feedback;
CREATE POLICY "Ops views feedback" ON seller_feedback
FOR SELECT USING (
    public.is_admin_of_type('operations') OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'ceo', 'cofounder'))
);
DROP POLICY IF EXISTS "Users write feedback" ON seller_feedback;
CREATE POLICY "Users write feedback" ON seller_feedback
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. DEFAULT UNIVERSITIES
-- ============================================
-- Helper table for dropdowns
CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO universities (id, name, domain) VALUES
('cosmopolitan_abuja', 'Cosmopolitan University Abuja', 'cosmopolitan.edu.ng'),
('nile_abuja', 'Nile University of Nigeria', 'nileuniversity.edu.ng'),
('baze_abuja', 'Baze University', 'bazeuniversity.edu.ng'),
('uni_abuja', 'University of Abuja', 'uniabuja.edu.ng')
ON CONFLICT (id) DO NOTHING;

