-- WARNING: BACK UP YOUR DATABASE BEFORE RUNNING THIS OVERHAUL SCRIPT.
-- THIS SCRIPT PERFORMS DESTRUCTIVE ACTIONS (DROPPING LEGACY DEALERSHIP COLUMNS).
-- Target: Refactor legacy car dealership schema to university campus marketplace schema.

BEGIN;

-- -------------------------------------------------------------------------
-- 1. Drop Legacy Views / Triggers / Constraints that might block modification
-- -------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_auto_verify_student ON public.users CASCADE;
DROP TRIGGER IF EXISTS trigger_create_wallet ON public.users CASCADE;
DROP TRIGGER IF EXISTS trigger_create_user_accounts ON public.users CASCADE;
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON public.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;
DROP TRIGGER IF EXISTS update_listings_updated_at ON public.listings CASCADE;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders CASCADE;
DROP TRIGGER IF EXISTS dispute_notification ON public.disputes CASCADE;

-- Drop legacy tables to recreate cleanly
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.market_coins CASCADE;
DROP TABLE IF EXISTS public.mc_transactions CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.seller_subscriptions CASCADE;
DROP TABLE IF EXISTS public.featured_listings CASCADE;
DROP TABLE IF EXISTS public.university_domains CASCADE;

-- -------------------------------------------------------------------------
-- 2. Base Utility Functions
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 3. Refactor users Table
-- -------------------------------------------------------------------------
-- Ensure role column exists (in case it was dropped and moved to profiles)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer';

-- Drop legacy dealership columns from users
ALTER TABLE public.users DROP COLUMN IF EXISTS store_type CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS business_name CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS cac_number CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS flutterwave_id CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS verification_documents CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS listing_limit CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_plan CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_status CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_start_date CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_end_date CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_expires_at CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS trial_start_date CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS wishlist CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS bank_name CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS account_number CASCADE;
ALTER TABLE public.users DROP COLUMN IF EXISTS account_name CASCADE;

-- Rename phone_number to phone
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone_number') THEN
        ALTER TABLE public.users RENAME COLUMN phone_number TO phone;
    END IF;
END $$;

-- Update role constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE public.users SET role = 'buyer' WHERE role IN ('customer', 'buyer');
UPDATE public.users SET role = 'seller' WHERE role IN ('dealer', 'seller');
UPDATE public.users SET role = 'admin' WHERE role NOT IN ('buyer', 'seller');
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('buyer', 'seller', 'admin'));

-- Add new campus-related columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'buyer' CHECK (account_type IN ('buyer', 'seller', 'both'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_email_domain TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS campus TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hostel TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS seller_stats JSONB DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- -------------------------------------------------------------------------
-- 4. Refactor listings Table
-- -------------------------------------------------------------------------
-- Drop car-specific columns
ALTER TABLE public.listings DROP COLUMN IF EXISTS make CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS model CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS year CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS condition CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS transmission CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS mileage CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS fuel_type CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS engine_size CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS body_type CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS vin CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS is_verified_listing CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS verification_status CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS inspection_report_url CASCADE;
ALTER TABLE public.listings DROP COLUMN IF EXISTS inspector_notes CASCADE;

-- Rename dealer_id to seller_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='dealer_id') THEN
        ALTER TABLE public.listings RENAME COLUMN dealer_id TO seller_id;
    END IF;
END $$;

-- Add new campus marketplace columns to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS compare_price INTEGER;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS listing_condition TEXT CHECK (listing_condition IN ('new', 'used', 'refurbished'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS campus TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS delivery_type TEXT CHECK (delivery_type IN ('pickup', 'campus_delivery', 'both'));
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS delivery_eta TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- -------------------------------------------------------------------------
-- 5. Refactor orders Table
-- -------------------------------------------------------------------------
-- Rename columns safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_address') THEN
        ALTER TABLE public.orders RENAME COLUMN shipping_address TO delivery_address;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='platform_fee') THEN
        ALTER TABLE public.orders RENAME COLUMN platform_fee TO service_fee;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='transaction_ref') THEN
        ALTER TABLE public.orders RENAME COLUMN transaction_ref TO payment_ref;
    END IF;
END $$;

-- Cast delivery_address to JSONB
ALTER TABLE public.orders ALTER COLUMN delivery_address TYPE JSONB USING delivery_address::JSONB;
ALTER TABLE public.orders DROP COLUMN IF EXISTS net_amount;
ALTER TABLE public.orders ALTER COLUMN payment_provider SET DEFAULT 'paystack';

-- Add new columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS unit_price INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_type TEXT CHECK (delivery_type IN ('pickup', 'campus_delivery'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mc_discount_used INTEGER DEFAULT 0;

-- -------------------------------------------------------------------------
-- 6. Refactor reviews Table
-- -------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='dealer_id') THEN
        ALTER TABLE public.reviews RENAME COLUMN dealer_id TO reviewee_id;
    END IF;
END $$;

-- -------------------------------------------------------------------------
-- 7. Create New Tables
-- -------------------------------------------------------------------------
-- UNIVERSITY DOMAINS
CREATE TABLE IF NOT EXISTS public.university_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_name TEXT NOT NULL,
    domain_pattern TEXT NOT NULL UNIQUE,
    campus_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Focus Universities
INSERT INTO public.university_domains (university_name, domain_pattern, campus_name) VALUES
('Baze University', '%bazeuniversity.edu.ng', 'Main Campus'),
('Nile University of Nigeria', '%nileuniversity.edu.ng', 'Main Campus'),
('Veritas University', '%veritas.edu.ng', 'Bwari Campus'),
('Cosmopolitan University', '%cosmopolitan.edu.ng', 'Main Campus')
ON CONFLICT (domain_pattern) DO NOTHING;

-- WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0, -- in kobo
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'sale', 'refund', 'service_fee', 'delivery_earning', 'featured_listing_fee')),
    amount INTEGER NOT NULL, -- in kobo
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    reference TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKET COINS (Loyalty system)
CREATE TABLE IF NOT EXISTS public.market_coins (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,
    lifetime_earned INTEGER DEFAULT 0,
    lifetime_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MC TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.mc_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive = earned, negative = redeemed
    type TEXT NOT NULL CHECK (type IN ('purchase_reward', 'referral_bonus', 'referree_bonus', 'escrow_discount', 'admin_adjustment')),
    description TEXT,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REFERRALS
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    mc_rewarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(referrer_id, referee_id)
);

-- BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CART ITEMS
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('order_update', 'new_message', 'verification', 'promotion', 'wallet', 'dispute', 'payout', 'mc_earned', 'referral_completed')),
    title TEXT,
    body TEXT,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SELLER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.seller_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('basic', 'standard', 'pro')),
    status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'cancelled', 'expired')),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    is_ambassador BOOLEAN DEFAULT FALSE,
    ambassador_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEATURED LISTINGS
CREATE TABLE IF NOT EXISTS public.featured_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    duration_days INTEGER NOT NULL,
    fee INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    featured_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISPUTES
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    opened_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'resolved_split')),
    resolution_note TEXT,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 8. Functions & Triggers
-- -------------------------------------------------------------------------

-- Auto-verify student on insert & set role = 'seller'
CREATE OR REPLACE FUNCTION auto_verify_student()
RETURNS TRIGGER AS $$
DECLARE
    email_domain TEXT;
BEGIN
    email_domain := split_part(NEW.email, '@', 2);
    
    IF EXISTS (
        SELECT 1 FROM public.university_domains
        WHERE is_active = TRUE
        AND email_domain LIKE domain_pattern
    ) THEN
        NEW.is_verified := TRUE;
        NEW.is_student := TRUE;
        NEW.role := 'seller';
        NEW.student_email_domain := email_domain;
        NEW.university := (
            SELECT university_name FROM public.university_domains
            WHERE email_domain LIKE domain_pattern
            LIMIT 1
        );
        NEW.campus := (
            SELECT campus_name FROM public.university_domains
            WHERE email_domain LIKE domain_pattern
            LIMIT 1
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_auto_verify_student
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_verify_student();

-- Trigger: Generate Referral Code BEFORE INSERT (Phase 1 Split)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate unique referral code
    NEW.referral_code := upper(substring(md5(random()::text), 1, 8));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_code
    BEFORE INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();

-- Trigger: Create wallet + MC AFTER INSERT (Phase 2 Split)
CREATE OR REPLACE FUNCTION create_user_accounts()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
    INSERT INTO public.market_coins (user_id, balance) VALUES (NEW.id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_accounts
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_accounts();

-- Award MC on completed transaction
CREATE OR REPLACE FUNCTION award_mc_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
    mc_earned INTEGER;
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- 50 MC per ₦10,000 spent (total_amount in kobo, 10,000 NGN = 1,000,000 kobo)
        mc_earned := floor(NEW.total_amount / 1000000) * 50;
        
        IF mc_earned > 0 THEN
            UPDATE public.market_coins SET 
                balance = balance + mc_earned,
                lifetime_earned = lifetime_earned + mc_earned
            WHERE user_id = NEW.buyer_id;
            
            INSERT INTO public.mc_transactions (user_id, amount, type, description, related_order_id)
            VALUES (NEW.buyer_id, mc_earned, 'purchase_reward', 'MC earned from purchase', NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_mc
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION award_mc_on_purchase();

-- Re-register updated_at auto triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fix order fee trigger for service_fee renaming
CREATE OR REPLACE FUNCTION update_order_fees() RETURNS TRIGGER AS $$
DECLARE fees RECORD;
BEGIN
    SELECT * INTO fees FROM calculate_platform_fee(NEW.amount);
    NEW.service_fee := fees.platform_fee;
    NEW.seller_receives := fees.seller_receives;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_order_fees ON public.orders;
CREATE TRIGGER trg_update_order_fees BEFORE INSERT OR UPDATE OF amount ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_order_fees();

-- Re-register new user auth trigger using phone instead of phone_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    display_name, 
    role, 
    photo_url,
    location,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 9. Enable Row Level Security (RLS) & Define Access Policies
-- -------------------------------------------------------------------------
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mc_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_domains ENABLE ROW LEVEL SECURITY;

-- Wallets
CREATE POLICY wallets_read ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY transactions_read ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY notifications_read ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Cart items
CREATE POLICY cart_items_own ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Favorites
CREATE POLICY favorites_own ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Bank accounts
CREATE POLICY bank_accounts_own ON public.bank_accounts FOR ALL USING (auth.uid() = user_id);

-- Market Coins
CREATE POLICY market_coins_read ON public.market_coins FOR SELECT USING (auth.uid() = user_id);

-- MC Transactions
CREATE POLICY mc_transactions_read ON public.mc_transactions FOR SELECT USING (auth.uid() = user_id);

-- Referrals
CREATE POLICY referrals_own ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Seller Subscriptions
CREATE POLICY seller_subscriptions_read ON public.seller_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Featured Listings
CREATE POLICY featured_listings_read ON public.featured_listings FOR SELECT USING (true);

-- Disputes
CREATE POLICY disputes_own ON public.disputes FOR SELECT USING (auth.uid() = opened_by OR auth.uid() = (SELECT buyer_id FROM public.orders WHERE id = order_id) OR auth.uid() = (SELECT seller_id FROM public.orders WHERE id = order_id));

-- University Domains
CREATE POLICY university_domains_read ON public.university_domains FOR SELECT USING (true);

COMMIT;
