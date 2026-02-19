-- Migration: Marketplace Expansion & Revenue Engine
-- Date: 2026-02-19
-- Project: MarketBridge

-- 1. COINS SYSTEM
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS coins_balance INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.coins_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    amount INTEGER NOT NULL, -- positive for earn, negative for redeem
    type TEXT NOT NULL CHECK (type IN ('earn_purchase', 'earn_sale', 'redeem', 'referral', 'referral_welcome', 'adjustment', 'promotion')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_coins_transactions_user_id ON public.coins_transactions(user_id);

-- 2. SELLER SUBACCOUNT & AUTOMATION
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- 3. PUBLIC SECTION KILL-SWITCH & CONFIG
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Default settings
INSERT INTO public.site_settings (key, value)
VALUES ('public_section_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. SPONSORED LISTINGS & PREMIUM
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sponsorship_type TEXT; -- 'top_placement', 'category_boost'

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS referral_link_code TEXT UNIQUE;

-- Trigger to generate referral code for NEW users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_link_code IS NULL THEN
        NEW.referral_link_code := substring(md5(gen_random_uuid()::text || random()::text), 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_referral_code ON public.users;
CREATE TRIGGER trigger_generate_referral_code
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Initialize referral codes for existing users
UPDATE public.users 
SET referral_link_code = substring(md5(id::text || random()::text), 1, 8)
WHERE referral_link_code IS NULL;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS referred_by_id UUID REFERENCES public.users(id);

-- 6. RPC FUNCTIONS FOR COINS (Atomic Updates)
CREATE OR REPLACE FUNCTION public.add_coins(
    user_id UUID,
    amount_to_add INTEGER,
    trans_type TEXT,
    trans_desc TEXT
) RETURNS VOID AS $$
BEGIN
    -- Update balance
    UPDATE public.users 
    SET coins_balance = COALESCE(coins_balance, 0) + amount_to_add 
    WHERE id = user_id;

    -- Log transaction
    INSERT INTO public.coins_transactions (user_id, amount, type, description)
    VALUES (user_id, amount_to_add, trans_type, trans_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.subtract_coins(
    user_id UUID,
    amount_to_subtract INTEGER,
    trans_type TEXT,
    trans_desc TEXT
) RETURNS VOID AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT coins_balance INTO current_balance FROM public.users WHERE id = user_id;
    
    IF current_balance < amount_to_subtract THEN
        RAISE EXCEPTION 'Insufficient MarketCoins balance';
    END IF;

    -- Update balance
    UPDATE public.users 
    SET coins_balance = coins_balance - amount_to_subtract 
    WHERE id = user_id;

    -- Log transaction
    INSERT INTO public.coins_transactions (user_id, amount, type, description)
    VALUES (user_id, -amount_to_subtract, trans_type, trans_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. PERMISSIONS FOR TECH ADMIN (Public Section Toggle)
-- Assuming roles like 'technical_admin' or 'ceo' can update settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
CREATE POLICY "Admins can update settings" ON public.site_settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'ceo', 'cofounder', 'technical_admin')
    )
);

DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
CREATE POLICY "Anyone can view settings" ON public.site_settings
FOR SELECT USING (true);

-- 8. AUTOMATIC COIN REWARDS TRIGGER
CREATE OR REPLACE FUNCTION public.reward_coins_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    buyer_coins INTEGER;
    seller_coins INTEGER;
BEGIN
    -- Only act when status changes to 'completed' or 'delivered'
    IF (NEW.status = 'completed' OR NEW.status = 'delivered') AND (OLD.status != 'completed' AND OLD.status != 'delivered') THEN
        -- Reward Buyer: 1 coin per 100 NGN
        buyer_coins := floor(NEW.amount / 100);
        IF buyer_coins > 0 THEN
            PERFORM public.add_coins(NEW.buyer_id, buyer_coins, 'earn_purchase', 'Reward for order #' || NEW.id);
        END IF;

        -- Reward Seller: 1 coin per 200 NGN
        IF NEW.seller_id IS NOT NULL THEN
            seller_coins := floor(NEW.amount / 200);
            IF seller_coins > 0 THEN
                PERFORM public.add_coins(NEW.seller_id, seller_coins, 'earn_sale', 'Reward for selling order #' || NEW.id);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_reward_coins ON public.orders;
CREATE TRIGGER trigger_reward_coins
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.reward_coins_on_completion();
