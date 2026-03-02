-- ===========================
-- SUBSCRIPTION MANAGEMENT & MANUAL ACTIVATION
-- ===========================
-- 1. Create subscription_requests table for manual verification flow
CREATE TABLE IF NOT EXISTS public.subscription_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL,
    -- 'starter', 'pro', 'elite'
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    -- 'monthly', 'annual'
    status TEXT NOT NULL DEFAULT 'pending',
    -- 'pending', 'approved', 'rejected'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Add subscription columns to users table if they don't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT DEFAULT 'starter',
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
-- 3. RLS - Policies for subscription_requests
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
-- Users can view their own requests
CREATE POLICY "Users can view their own subscription requests" ON public.subscription_requests FOR
SELECT USING (auth.uid() = user_id);
-- Users can insert their own requests
CREATE POLICY "Users can create their own subscription requests" ON public.subscription_requests FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Admins can view/update all requests (Assuming admin role check)
CREATE POLICY "Admins can manage all subscription requests" ON public.subscription_requests FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin', 'ceo', 'cofounder')
    )
);
-- 4. Function to Update updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_subscription_requests_updated_at BEFORE
UPDATE ON public.subscription_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();