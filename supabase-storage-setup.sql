-- ============================================
-- SUPABASE STORAGE SETUP FOR PROFILE IMAGES
-- ============================================

-- This file documents the required Supabase Storage buckets
-- Run these commands in the Supabase Dashboard under Storage

-- 1. Create 'avatars' bucket for profile pictures
-- Go to Storage > Create a new bucket
-- Name: avatars
-- Public: YES (so profile pictures can be viewed publicly)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

-- 2. Set up Storage Policies for 'avatars' bucket
-- These policies allow authenticated users to upload and manage their own avatars

-- Policy 1: Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy 2: Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 3: Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 4: Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- VERIFICATION
-- ============================================
-- After creating the bucket and policies:
-- 1. Go to Settings page in the app
-- 2. Click on the profile picture upload area
-- 3. Select an image
-- 4. The image should upload and display immediately
-- 5. Click "Save Profile Changes" to persist the URL to the database
