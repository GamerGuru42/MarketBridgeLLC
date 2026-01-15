-- ============================================
-- ADD IMAGE SUPPORT TO CHAT MESSAGES
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Add image_url column to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for chat images
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;

CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'chat-images' AND
    (SELECT auth.uid()) IS NOT NULL
);

CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete their own chat images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'chat-images' AND
    owner = (SELECT auth.uid())
);
