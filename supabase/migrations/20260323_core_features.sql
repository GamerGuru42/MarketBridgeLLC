-- 20260323_core_features.sql
-- New features: OTP Verification, Market Coins, 7-Stage Escrow, Disputes, Reviews.

-- Add new columns to users if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS otp_hash text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coins_balance integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS matric_number text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 0.0;

-- 1. Transactions (Escrow Engine)
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
    buyer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    seller_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    amount numeric NOT NULL,
    fee_tier text NOT NULL, -- 'tier1', 'tier2'
    platform_fee numeric NOT NULL,
    high_value_fee numeric DEFAULT 0,
    mc_discount numeric DEFAULT 0,
    total_paid numeric NOT NULL,
    payout_amount numeric NOT NULL,
    status text DEFAULT 'initialized', -- 'initialized', 'terms_setup', 'terms_locked', 'escrow_funded', 'logistics_delivery', 'buyer_confirmed', 'funds_released', 'disputed', 'cancelled'
    terms jsonb, -- { condition, return_policy, logistics_method, logistics_cost, auto_release_hours }
    paystack_reference text,
    auto_release_at timestamptz,
    delivery_photo_url text, -- Buyer uploaded photo
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND role IN ('admin', 'ceo', 'operations_admin', 'technical_admin')));

-- Buyers can create initialized transactions
CREATE POLICY "Buyers can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Both parties can update the transaction according to the state machine
CREATE POLICY "Participants can update transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);


-- 3. Reviews (Reputation System)
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    escrow_agreement_id uuid REFERENCES public.escrow_agreements(id) ON DELETE CASCADE,
    reviewer_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can see reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

-- Participants can insert reviews after transaction is finished
CREATE POLICY "Participants can insert reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
