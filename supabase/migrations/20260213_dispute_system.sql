-- Create Disputes Table
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE, -- Link to Orders (Checkout Flow)
    escrow_agreement_id UUID REFERENCES public.escrow_agreements(id) ON DELETE CASCADE, -- Link to Smart Escrow (Chat Flow)
    filed_by_id UUID REFERENCES public.users(id) NOT NULL,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: Must belong to either Order OR Escrow Agreement
    CONSTRAINT dispute_target_check CHECK (
        (order_id IS NOT NULL AND escrow_agreement_id IS NULL) OR
        (order_id IS NULL AND escrow_agreement_id IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Users can Insert disputes if they are involved
CREATE POLICY "Users can file disputes" ON public.disputes
    FOR INSERT
    WITH CHECK (auth.uid() = filed_by_id);

-- 2. Users can View their own disputes
CREATE POLICY "Users can view own disputes" ON public.disputes
    FOR SELECT
    USING (auth.uid() = filed_by_id);

-- 3. Admins can View ALL disputes
CREATE POLICY "Admins can view all disputes" ON public.disputes
    FOR SELECT
    USING (check_is_admin());

-- 4. Admins can Update disputes (Resolve/Reject)
CREATE POLICY "Admins can update disputes" ON public.disputes
    FOR UPDATE
    USING (check_is_admin());

-- Indexes for Admin Dashboard performance
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_disputes_created_at ON public.disputes(created_at DESC);
CREATE INDEX idx_disputes_filed_by ON public.disputes(filed_by_id);

-- Add 'disputed' status to Orders if not exists
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'paid', 'confirmed', 'disputed', 'completed', 'cancelled'));

-- Add 'disputed' status to Escrow Agreements
ALTER TABLE public.escrow_agreements DROP CONSTRAINT IF EXISTS escrow_status_check;
ALTER TABLE public.escrow_agreements ADD CONSTRAINT escrow_status_check 
    CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'disputed', 'released', 'refunded'));
    
-- Ensure 'is_verified' column exists on users for Admin Verification flow
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
