-- MarketBridge Plan Swap and Ambassador System Migration
-- Date: 2026-04-13
-- Goal: Update plan IDs and create Ambassador system tables

-- 1. UPDATE PLAN IDs IN SUBSCRIPTIONS TABLE
-- Drop old check constraint and add new one
ALTER TABLE IF EXISTS public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_plan_id_check 
CHECK (plan_id IN ('basic', 'standard', 'pro'));

-- 2. UPDATE SUBSCRIPTION_PLANS REFERENCE TABLE
-- First clear old plans (manual cleanup to avoid conflicts)
DELETE FROM public.subscription_plans WHERE id IN ('free', 'campus_starter', 'campus_pro', 'enterprise');

INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_annual, features, limits, sort_order) VALUES
('basic', 'Basic', 'Standard campus selling', 0, 0, 
    '["5 active listings", "Standard dashboard", "Buyer messaging", "Escrow protection"]',
    '{"max_listings": 5}',
    1
),
('standard', 'Standard', 'Unlimited growth for serious sellers', 1500, 14400,
    '["Unlimited active listings", "Analytics dashboard", "Search priority", "Negotiation tools"]',
    '{"max_listings": -1}',
    2
),
('pro', 'Pro', 'Maximum visibility and priority support', 3500, 33600,
    '["Top of feed priority", "Featured Seller badge", "Advanced analytics", "Priority support"]',
    '{"max_listings": -1, "priority_placement": true, "featured_badge": true}',
    3
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_annual = EXCLUDED.price_annual,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits;

-- 3. MIGRATE EXISTING DATA
-- Update users table plan IDs
UPDATE public.users 
SET subscription_plan_id = 'basic' 
WHERE subscription_plan_id IN ('free', 'campus_starter');

UPDATE public.users 
SET subscription_plan_id = 'pro' 
WHERE subscription_plan_id IN ('campus_pro', 'enterprise', 'elite'); -- Some might have 'elite' from UI

-- Update subscriptions table plan IDs
UPDATE public.subscriptions
SET plan_id = 'basic'
WHERE plan_id IN ('free', 'campus_starter');

UPDATE public.subscriptions
SET plan_id = 'pro'
WHERE plan_id IN ('campus_pro', 'enterprise', 'elite');

-- Update subscription_requests plan IDs
UPDATE public.subscription_requests
SET plan_id = 'standard'
WHERE plan_id IN ('pro', 'campus_pro'); -- Standard is the new mid-tier

UPDATE public.subscription_requests
SET plan_id = 'pro'
WHERE plan_id IN ('elite');

-- 4. BRAND AMBASSADOR TABLES
CREATE TABLE IF NOT EXISTS public.ambassador_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campus TEXT NOT NULL,
    motivation TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- One application at a time
);

CREATE TABLE IF NOT EXISTS public.ambassadors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campus TEXT NOT NULL,
    badge_active BOOLEAN DEFAULT TRUE,
    pro_trial_ends_at TIMESTAMPTZ NOT NULL, -- 44 days from approval
    bonus_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. RLS POLICIES FOR AMBASSADORS
ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;

-- Applications policies
CREATE POLICY "Users can view their own application" ON public.ambassador_applications 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit applications" ON public.ambassador_applications 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage applications" ON public.ambassador_applications 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'ceo', 'operations')
    )
);

-- Ambassadors policies
CREATE POLICY "Everyone can see who is an ambassador" ON public.ambassadors 
FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage ambassadors" ON public.ambassadors 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'ceo', 'operations')
    )
);

-- 6. ADD AMBASSADOR FLAG TO USERS (OPTIONAL BUT HELPFUL)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN DEFAULT FALSE;
