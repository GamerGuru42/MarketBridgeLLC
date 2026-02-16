-- Storage Buckets Initialization
-- Date: 2026-02-16
-- Purpose: Setup all necessary storage buckets and RLS policies for flawlessly handling media.

-- 1. Create Buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('listings', 'listings', true),
    ('identity', 'identity', true),
    ('listings-videos', 'listings-videos', true),
    ('receipts', 'receipts', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (just in case)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Clear existing policies to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public View Listings" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Listings" ON storage.objects;
    DROP POLICY IF EXISTS "Public View Identity" ON storage.objects;
    DROP POLICY IF EXISTS "Anon Upload Identity" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Identity" ON storage.objects;
    DROP POLICY IF EXISTS "Owner Delete Own Objects" ON storage.objects;
    DROP POLICY IF EXISTS "Public View Videos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Videos" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- 4. General View Policy (Since buckets are public)
CREATE POLICY "Public View Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id IN ('listings', 'identity', 'listings-videos', 'receipts', 'avatars'));

-- 5. Listings Policies
CREATE POLICY "Authenticated Upload Listings" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listings');

-- 6. Identity (Student ID) Policies
-- Allow anonymous uploads for signup flow (stored in 'public/' folder)
CREATE POLICY "Anon Upload Identity" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'identity' AND (storage.foldername(name))[1] = 'public');

CREATE POLICY "Authenticated Upload Identity" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'identity');

-- 7. Videos Policies
CREATE POLICY "Authenticated Upload Videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listings-videos');

-- 8. Receipts Policies (Duplicate check-in case)
CREATE POLICY "Authenticated Upload Receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- 9. Cleanup Policy (Users can delete their own uploads)
CREATE POLICY "Owner Delete Own Objects" ON storage.objects
FOR DELETE TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Add a special policy for admin override if needed
CREATE POLICY "Admins Full Access" ON storage.objects
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'ceo', 'technical_admin')
    )
);
