-- Supabase Storage Setup for Media Uploads
-- This script creates the necessary storage buckets and policies for image and video uploads

-- Create listings bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Create listings-videos bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings-videos', 'listings-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for listings bucket (images)
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

-- Allow public to view listing images
CREATE POLICY "Public can view listing images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listings');

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for listings-videos bucket
-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload listing videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings-videos');

-- Allow public to view listing videos
CREATE POLICY "Public can view listing videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listings-videos');

-- Allow users to delete their own uploaded videos
CREATE POLICY "Users can delete their own listing videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listings-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set file size limits (optional, can be configured in Supabase dashboard)
-- Images: 5MB
-- Videos: 50MB

-- Add comments for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for MarketBridge media files';
