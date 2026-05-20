-- ============================================
-- MARKETBRIDGE: RATINGS & REVIEWS EXPANSION
-- ============================================

-- 1. ADD new columns to public.reviews (if they don't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'listing_id'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'photo_urls'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN photo_urls text[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'dealer_reply'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN dealer_reply text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'dealer_reply_at'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN dealer_reply_at timestamptz;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'helpful_count'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN helpful_count int DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.reviews ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'hidden'));
    END IF;
END $$;

-- 2. Add UNIQUE constraints to prevent duplicate reviews per user per listing/dealer
-- Note: the reviewer column is reviewer_id, and dealer is subject_id
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS one_review_per_user_per_listing;
ALTER TABLE public.reviews ADD CONSTRAINT one_review_per_user_per_listing UNIQUE (reviewer_id, listing_id) WHERE listing_id IS NOT NULL;

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS one_review_per_user_per_dealer;
ALTER TABLE public.reviews ADD CONSTRAINT one_review_per_user_per_dealer UNIQUE (reviewer_id, subject_id) WHERE listing_id IS NULL;

-- 3. Create review_votes table
CREATE TABLE IF NOT EXISTS public.review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type text CHECK (vote_type IN ('helpful', 'unhelpful')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(review_id, user_id)
);

-- Enable RLS on review_votes
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist and create
DROP POLICY IF EXISTS "Anyone can view votes" ON public.review_votes;
CREATE POLICY "Anyone can view votes" ON public.review_votes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own votes" ON public.review_votes;
CREATE POLICY "Users can manage their own votes" ON public.review_votes
    FOR ALL USING (auth.uid() = user_id);

-- 4. Trigger function to compute helpful_count dynamically
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.reviews 
    SET helpful_count = (
        SELECT COUNT(*) FROM public.review_votes 
        WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
        AND vote_type = 'helpful'
    )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on review_votes
DROP TRIGGER IF EXISTS update_helpful_count ON public.review_votes;
CREATE TRIGGER update_helpful_count
AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
FOR EACH ROW EXECUTE FUNCTION update_review_helpful_count();

-- 5. RLS Policies Updates on public.reviews
-- First, drop existing view/insert policies to redefine them
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Participants can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

-- Anyone can view approved reviews
CREATE POLICY "View approved reviews" ON public.reviews
    FOR SELECT USING (status = 'approved');

-- Users can view their own reviews regardless of status
CREATE POLICY "View own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = reviewer_id);

-- Sellers can view reviews written about them regardless of status (so they can see pending ones to moderate/respond)
CREATE POLICY "View received reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = subject_id);

-- Authenticated users can insert reviews
CREATE POLICY "Insert reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Sellers/Dealers can reply to reviews written about them (so they can update the dealer_reply column)
CREATE POLICY "Update own reviews reply" ON public.reviews
    FOR UPDATE USING (auth.uid() = subject_id OR auth.uid() = reviewer_id);

-- 6. STORAGE BUCKET for review images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'review-images',
    'review-images',
    true,
    2097152,  -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies for review-images bucket
DROP POLICY IF EXISTS "Users can upload review images" ON storage.objects;
CREATE POLICY "Users can upload review images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'review-images'
        AND auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Public can view review images" ON storage.objects;
CREATE POLICY "Public can view review images" ON storage.objects
    FOR SELECT USING (bucket_id = 'review-images');

DROP POLICY IF EXISTS "Users can delete own review images" ON storage.objects;
CREATE POLICY "Users can delete own review images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'review-images'
        AND auth.uid() IS NOT NULL
    );
