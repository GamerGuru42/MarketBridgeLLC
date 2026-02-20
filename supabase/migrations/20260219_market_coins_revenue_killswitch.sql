-- MarketBridge Revenue & Features Migration
-- Target: Nigerian University Beta + Public Section Controls

-- 1. MarketCoins System
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coins_balance NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id);

CREATE TABLE IF NOT EXISTS public.coins_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn_purchase', 'earn_sale', 'redeem_discount', 'referral_bonus', 'admin_adjustment')),
    description TEXT,
    order_id UUID REFERENCES public.orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Referrals System
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id),
    referred_id UUID NOT NULL REFERENCES public.users(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    purchase_threshold_met BOOLEAN DEFAULT FALSE,
    bonus_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- 3. Sponsored Listings
CREATE TABLE IF NOT EXISTS public.sponsored_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Site Settings (Kill-Switch)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (key, value, description)
VALUES ('public_section_enabled', 'false', 'Kill-switch for /public marketplace section')
ON CONFLICT (key) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE public.coins_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users can view their own coin transactions" ON public.coins_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Anyone can view active site settings" ON public.site_settings
    FOR SELECT USING (true);

-- Admin only policies for site_settings update
CREATE POLICY "Admins can update site settings" ON public.site_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('ceo', 'technical_admin', 'operations_admin')
        )
    );

-- 7. MarketCoin RPC Functions
CREATE OR REPLACE FUNCTION public.add_coins(
    user_id UUID,
    amount_to_add NUMERIC,
    trans_type TEXT,
    trans_desc TEXT DEFAULT NULL,
    order_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update user balance
    UPDATE public.users
    SET coins_balance = COALESCE(coins_balance, 0) + amount_to_add
    WHERE id = user_id;

    -- Record transaction
    INSERT INTO public.coins_transactions (user_id, amount, type, description, order_id)
    VALUES (user_id, amount_to_add, trans_type, trans_desc, order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.subtract_coins(
    user_id UUID,
    amount_to_subtract NUMERIC,
    trans_type TEXT DEFAULT 'redeem_discount',
    trans_desc TEXT DEFAULT NULL,
    order_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    SELECT coins_balance INTO current_balance FROM public.users WHERE id = user_id;
    
    IF current_balance < amount_to_subtract THEN
        RAISE EXCEPTION 'Insufficient coin balance';
    END IF;

    -- Update user balance
    UPDATE public.users
    SET coins_balance = coins_balance - amount_to_subtract
    WHERE id = user_id;

    -- Record transaction
    INSERT INTO public.coins_transactions (user_id, amount, type, description, order_id)
    VALUES (user_id, -amount_to_subtract, trans_type, trans_desc, order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
