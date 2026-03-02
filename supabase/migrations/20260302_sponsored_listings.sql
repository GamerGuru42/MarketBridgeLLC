-- =============================================
-- Sponsored / Promoted Listings Support
-- Uses existing is_sponsored / sponsored_until columns (consistent with marketplace queries)
-- =============================================
-- Add sponsorship fields to listings (if not already present from older migrations)
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS sponsored_tier TEXT DEFAULT NULL;
-- 'basic' | 'featured' | 'premium'
-- Index for fast marketplace queries (sponsored first)
CREATE INDEX IF NOT EXISTS idx_listings_sponsored ON public.listings (is_sponsored DESC, created_at DESC);
-- Auto-expire sponsorships helper function (call periodically or from API)
CREATE OR REPLACE FUNCTION expire_old_sponsorships() RETURNS void LANGUAGE plpgsql AS $$ BEGIN
UPDATE public.listings
SET is_sponsored = FALSE,
    sponsored_until = NULL,
    sponsored_tier = NULL
WHERE is_sponsored = TRUE
    AND sponsored_until IS NOT NULL
    AND sponsored_until < NOW();
END;
$$;
-- Expose as RPC so the marketplace can call it client-side
CREATE OR REPLACE FUNCTION sync_sponsorship_expiry() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN PERFORM expire_old_sponsorships();
END;
$$;