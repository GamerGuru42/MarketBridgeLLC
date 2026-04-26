-- Migration: Platform Revamp Init
-- Date: April 26, 2026

-- 1. Update Users Table Role Constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('buyer', 'seller', 'admin', 'ceo'));

-- 2. Add Onboarding Columns to Users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payout_setup boolean DEFAULT false;

-- 3. Create Seller Payouts Table
CREATE TABLE IF NOT EXISTS public.seller_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    bank_name text NOT NULL,
    bank_code text NOT NULL,
    account_number text NOT NULL,
    account_holder_name text NOT NULL,
    is_verified boolean DEFAULT false,
    verification_method text DEFAULT 'paystack',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Enable RLS on seller_payouts
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;

-- 5. Payouts Policies
DROP POLICY IF EXISTS "Sellers can view own payouts" ON public.seller_payouts;
CREATE POLICY "Sellers can view own payouts" ON public.seller_payouts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can insert own payouts" ON public.seller_payouts;
CREATE POLICY "Sellers can insert own payouts" ON public.seller_payouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can update own payouts" ON public.seller_payouts;
CREATE POLICY "Sellers can update own payouts" ON public.seller_payouts
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_seller_payouts_updated_at ON public.seller_payouts;
CREATE TRIGGER update_seller_payouts_updated_at
    BEFORE UPDATE ON public.seller_payouts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 7. Notify PostgREST
NOTIFY pgrst, 'reload schema';
