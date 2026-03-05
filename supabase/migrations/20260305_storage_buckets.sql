-- ============================================================
-- MarketBridge Storage Bucket Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================
-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'listings',
        'listings',
        true,
        10485760,
        ARRAY ['image/jpeg','image/png','image/webp','image/gif']
    ),
    (
        'seller_docs',
        'seller_docs',
        true,
        5242880,
        ARRAY ['image/jpeg','image/png','image/webp','application/pdf']
    ),
    (
        'listings-videos',
        'listings-videos',
        true,
        52428800,
        ARRAY ['video/mp4','video/quicktime','video/x-msvideo','video/webm']
    ),
    (
        'avatars',
        'avatars',
        true,
        2097152,
        ARRAY ['image/jpeg','image/png','image/webp']
    ) ON CONFLICT (id) DO
UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
-- 2. Drop old policies to avoid duplicates
DO $$
DECLARE buckets TEXT [] := ARRAY ['listings', 'seller_docs', 'listings-videos', 'avatars'];
b TEXT;
BEGIN FOREACH b IN ARRAY buckets LOOP EXECUTE format(
    'DROP POLICY IF EXISTS "Public read %s" ON storage.objects',
    b
);
EXECUTE format(
    'DROP POLICY IF EXISTS "Auth upload %s" ON storage.objects',
    b
);
EXECUTE format(
    'DROP POLICY IF EXISTS "Owner update %s" ON storage.objects',
    b
);
EXECUTE format(
    'DROP POLICY IF EXISTS "Owner delete %s" ON storage.objects',
    b
);
END LOOP;
END $$;
-- 3. Public READ for all buckets
CREATE POLICY "Public read listings" ON storage.objects FOR
SELECT USING (bucket_id = 'listings');
CREATE POLICY "Public read seller_docs" ON storage.objects FOR
SELECT USING (bucket_id = 'seller_docs');
CREATE POLICY "Public read listings-videos" ON storage.objects FOR
SELECT USING (bucket_id = 'listings-videos');
CREATE POLICY "Public read avatars" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
-- 4. Authenticated UPLOAD for all buckets
CREATE POLICY "Auth upload listings" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'listings'
        AND auth.role() = 'authenticated'
    );
CREATE POLICY "Auth upload seller_docs" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'seller_docs'
        AND auth.role() = 'authenticated'
    );
CREATE POLICY "Auth upload listings-videos" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'listings-videos'
        AND auth.role() = 'authenticated'
    );
CREATE POLICY "Auth upload avatars" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
    );
-- 5. Owner UPDATE
CREATE POLICY "Owner update listings" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'listings'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Owner update seller_docs" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'seller_docs'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
-- 6. Owner DELETE
CREATE POLICY "Owner delete listings" ON storage.objects FOR DELETE USING (
    bucket_id = 'listings'
    AND auth.uid()::text = (storage.foldername(name)) [1]
);
CREATE POLICY "Owner delete seller_docs" ON storage.objects FOR DELETE USING (
    bucket_id = 'seller_docs'
    AND auth.uid()::text = (storage.foldername(name)) [1]
);
-- ============================================================
-- Verify:
-- SELECT id, name, public FROM storage.buckets;
-- ============================================================