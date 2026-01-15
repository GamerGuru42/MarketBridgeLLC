-- Migration: Add videos column to listings table
-- This allows dealers to upload videos for their listings

-- Add videos column to listings table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS videos TEXT[];

-- Add comment to the column
COMMENT ON COLUMN public.listings.videos IS 'Array of video URLs uploaded by dealers for the listing';
