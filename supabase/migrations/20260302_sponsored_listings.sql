-- =============================================
-- Sponsored / Promoted Listings Support
-- =============================================
-- Add promotion fields to listings
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS promotion_price NUMERIC(10, 2) DEFAULT NULL;
-- Index for fast marketplace queries (promoted first)
CREATE INDEX IF NOT EXISTS idx_listings_promoted ON public.listings (is_promoted DESC, created_at DESC);
-- Track promotion transactions
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.users(id),
    amount_paid NUMERIC(10, 2) DEFAULT 0,
    duration_days INTEGER DEFAULT 7,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: admins/ceo can manage promotions; sellers can view their own
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admin can manage promotions" ON public.promotions FOR ALL USING (
    auth.uid() IN (
        SELECT id
        FROM public.users
        WHERE role IN ('admin', 'ceo')
    )
);
CREATE POLICY IF NOT EXISTS "Sellers can view own promotions" ON public.promotions FOR
SELECT USING (auth.uid() = seller_id);
-- Function: auto-expire promotions past their end date
CREATE OR REPLACE FUNCTION expire_old_promotions() RETURNS void LANGUAGE plpgsql AS $$ BEGIN
UPDATE public.listings
SET is_promoted = FALSE,
    promoted_until = NULL
WHERE is_promoted = TRUE
    AND promoted_until IS NOT NULL
    AND promoted_until < NOW();
END;
$$;