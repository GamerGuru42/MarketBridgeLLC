-- MARKETBRIDGE COMPLETE NETWORK REDUX (APRIL 2026)
-- A comprehensive standardization of identity roles, escrow lifecycles, and economic loyalty.

BEGIN;

-- =============================================
-- 1. IDENTITY & ACCESS HARDENING
-- =============================================

-- Standardize User Roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE public.users SET role = 'buyer' WHERE role = 'customer';
UPDATE public.users SET role = 'seller' WHERE role IN ('dealer', 'student_seller');
UPDATE public.users SET role = 'ceo' WHERE role IN ('ceo', 'cofounder', 'cto', 'coo');
UPDATE public.users SET role = 'tech_admin' WHERE role = 'technical_admin';

ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('buyer', 'seller', 'ambassador', 'ops_admin', 'marketing_admin', 'tech_admin', 'ceo'));

-- Standardize Subscription Plans
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_plan_check;
UPDATE public.users SET subscription_plan = 'basic' WHERE subscription_plan IN ('starter', 'campus_starter', 'free', NULL);
UPDATE public.users SET subscription_plan = 'standard' WHERE subscription_plan IN ('professional', 'standard');
UPDATE public.users SET subscription_plan = 'pro' WHERE subscription_plan IN ('enterprise', 'pro', 'campus_pro', 'elite');

ALTER TABLE public.users ADD CONSTRAINT users_subscription_plan_check 
CHECK (subscription_plan IN ('basic', 'standard', 'pro'));

-- =============================================
-- 2. MARKETPLACE ENGINE: CONDITIONS & LISTINGS
-- =============================================

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_condition_check;
UPDATE public.listings SET condition = 'Used (Excellent)' WHERE condition IN ('Tokunbo', 'Nigerian Used', 'Used');

ALTER TABLE public.listings ADD CONSTRAINT listings_condition_check 
CHECK (condition IN (
    'Brand New', 'Like New (Open Box)', 'Used (Excellent)', 'Used (Good)', 'UK Used / Refurbished',
    'Freshly Made', 'Made Today', 'Pre-Packaged (Sealed)', 'Pre-Order (Made on Request)'
));

-- =============================================
-- 3. THE 7-STAGE ESCROW ENGINE
-- =============================================

-- Add Lifecycle Columns
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS escrow_stage INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stage_1_initiated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS stage_2_terms_fixed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_3_funds_escrowed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_4_dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_5_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_6_released_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stage_7_closed_at TIMESTAMPTZ;

-- Integration for Terms Builder
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS contract_terms JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS terms_accepted_by_seller BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_by_buyer BOOLEAN DEFAULT FALSE;

-- Delivery Verification (OTP)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_otp TEXT,
ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMPTZ;

-- Correct Status Constraint for 7-Stage Logic
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'negotiating', 'escrowed', 'shipped', 'inspected', 'completed', 'cancelled', 'disputed'));

-- Automated Stage Timestamping
CREATE OR REPLACE FUNCTION update_order_stage_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.escrow_stage = 2 AND OLD.escrow_stage = 1 THEN
        NEW.stage_2_terms_fixed_at = NOW();
    ELSIF NEW.escrow_stage = 3 AND OLD.escrow_stage = 2 THEN
        NEW.stage_3_funds_escrowed_at = NOW();
    ELSIF NEW.escrow_stage = 4 AND OLD.escrow_stage = 3 THEN
        NEW.stage_4_dispatched_at = NOW();
    ELSIF NEW.escrow_stage = 5 AND OLD.escrow_stage = 4 THEN
        NEW.stage_5_received_at = NOW();
    ELSIF NEW.escrow_stage = 6 AND OLD.escrow_stage = 5 THEN
        NEW.stage_6_released_at = NOW();
    ELSIF NEW.escrow_stage = 7 AND OLD.escrow_stage = 6 THEN
        NEW.stage_7_closed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_stage_timestamps ON public.orders;
CREATE TRIGGER trigger_update_order_stage_timestamps
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION update_order_stage_timestamps();

-- =============================================
-- 4. VANGUARD INITIATIVE: AMBASSADOR SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS public.ambassador_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    campus TEXT NOT NULL,
    motivation TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own applications" ON public.ambassador_applications;
CREATE POLICY "Users can view their own applications" ON public.ambassador_applications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit applications" ON public.ambassador_applications;
CREATE POLICY "Users can submit applications" ON public.ambassador_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 5. LOYALTY ARCHITECTURE: MARKETCOINS
-- =============================================

CREATE TABLE IF NOT EXISTS public.coins_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn_purchase', 'earn_sale', 'earn_boost', 'referral', 'redeem_discount')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coins_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own coin history" ON public.coins_transactions;
CREATE POLICY "Users can view their own coin history" ON public.coins_transactions
    FOR SELECT USING (auth.uid() = user_id);

COMMIT;
