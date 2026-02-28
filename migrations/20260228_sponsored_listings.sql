-- Migration: Sponsored Listings (Ads) System
-- Run in Supabase SQL Editor
-- 1. Add sponsorship columns to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS sponsored_tier TEXT CHECK (
        sponsored_tier IN ('basic', 'featured', 'premium')
    ),
    ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
-- Backfill expires_at for existing listings (30 days from creation)
UPDATE public.listings
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;
-- 2. Ad payments table
CREATE TABLE IF NOT EXISTS public.ad_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    paystack_reference TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'featured', 'premium')),
    duration_days INTEGER NOT NULL,
    amount_paid NUMERIC NOT NULL,
    sponsored_from TIMESTAMPTZ,
    sponsored_until TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'active', 'expired', 'failed')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS for ad_payments
ALTER TABLE public.ad_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers can view their own ad payments" ON public.ad_payments FOR
SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Service role full access to ad_payments" ON public.ad_payments FOR ALL TO service_role USING (true);
-- 3. Auto-expire sponsorships: update is_sponsored when sponsored_until passes
-- This function is called by the app on listing fetch (no cron needed for beta)
CREATE OR REPLACE FUNCTION public.sync_sponsorship_expiry() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE public.listings
SET is_sponsored = FALSE,
    sponsored_tier = NULL
WHERE is_sponsored = TRUE
    AND sponsored_until IS NOT NULL
    AND sponsored_until < NOW();
END;
$$;
-- 4. Function to increment view count atomically
CREATE OR REPLACE FUNCTION public.increment_listing_view(listing_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE public.listings
SET view_count = view_count + 1
WHERE id = listing_id;
END;
$$;
COMMENT ON TABLE public.ad_payments IS 'Tracks sponsored listing (ad boost) payments made by sellers';
COMMENT ON COLUMN public.listings.is_sponsored IS 'Whether this listing is currently boosted/sponsored';
COMMENT ON COLUMN public.listings.sponsored_until IS 'When the current sponsorship expires';
COMMENT ON COLUMN public.listings.sponsored_tier IS 'Sponsorship tier: basic, featured, or premium';
COMMENT ON COLUMN public.listings.view_count IS 'Total number of times this listing detail page was viewed';
COMMENT ON COLUMN public.listings.expires_at IS 'When this free listing expires (30 days from creation)';