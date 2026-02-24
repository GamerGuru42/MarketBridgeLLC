-- Final Beta Migration for MarketBridge Nigeria Launch
-- Date: 2026-02-24

-- 1. Add new columns to public.users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS coins_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT;

-- 2. Create coins_transactions table
CREATE TABLE IF NOT EXISTS public.coins_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'earn_purchase', 'earn_sale', 'redeem', 'referral_bonus'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    bonus_paid BOOLEAN DEFAULT FALSE,
    purchase_threshold_met BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- 4. RPC: Add Coins
CREATE OR REPLACE FUNCTION public.add_coins(
    user_id UUID,
    amount_to_add INTEGER,
    trans_type TEXT,
    trans_desc TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.users
    SET coins_balance = coins_balance + amount_to_add
    WHERE id = user_id;

    INSERT INTO public.coins_transactions (user_id, amount, type, description)
    VALUES (user_id, amount_to_add, trans_type, trans_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Subtract Coins
CREATE OR REPLACE FUNCTION public.subtract_coins(
    user_id UUID,
    amount_to_subtract INTEGER,
    trans_type TEXT,
    trans_desc TEXT
)
RETURNS VOID AS $$
BEGIN
    IF (SELECT coins_balance FROM public.users WHERE id = user_id) < amount_to_subtract THEN
        RAISE EXCEPTION 'Insufficient coin balance';
    END IF;

    UPDATE public.users
    SET coins_balance = coins_balance - amount_to_subtract
    WHERE id = user_id;

    INSERT INTO public.coins_transactions (user_id, amount, type, description)
    VALUES (user_id, -amount_to_subtract, trans_type, trans_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coins_transactions_user ON public.coins_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);

-- 7. RLS Policies for new tables
ALTER TABLE public.coins_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coin transactions" ON public.coins_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- 8. Generate referral codes for existing users if any
UPDATE public.users
SET referral_code = 'MB-' || UPPER(SUBSTRING(REPLACE(id::TEXT, '-', ''), 1, 8))
WHERE referral_code IS NULL;
