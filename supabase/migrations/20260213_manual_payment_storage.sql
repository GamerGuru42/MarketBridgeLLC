-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload receipts
-- Requires enabling RLS on storage.objects (usually enabled by default in Supabase)

-- Drop existing policies to avoid conflicts
DO $$ BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Public can view receipts" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'receipts');
