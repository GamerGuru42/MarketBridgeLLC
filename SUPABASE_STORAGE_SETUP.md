# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage buckets for image uploads in MarketBridge.

## Required Storage Buckets

MarketBridge uses two storage buckets:

1. **`listings`** - For product/listing images
2. **`avatars`** - For user profile photos

## Setup Instructions

### Method 1: Using Supabase Dashboard (Recommended)

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**

#### Create `listings` Bucket:
- **Name**: `listings`
- **Public bucket**: ✅ Enabled (so images are publicly accessible)
- Click **"Create bucket"**

#### Create `avatars` Bucket:
- **Name**: `avatars`
- **Public bucket**: ✅ Enabled
- Click **"Create bucket"**

### Method 2: Using SQL (Advanced)

Run this SQL in your Supabase SQL Editor:

```sql
-- Create listings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true);

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up storage policies for listings bucket
CREATE POLICY "Public Access to Listings"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'listings' );

CREATE POLICY "Authenticated users can upload to listings"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'listings' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update own listings images"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'listings' AND auth.uid() = owner );

CREATE POLICY "Users can delete own listings images"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'listings' AND auth.uid() = owner );

-- Set up storage policies for avatars bucket
CREATE POLICY "Public Access to Avatars"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' AND auth.uid() = owner );
```

## Verification

To verify the buckets were created successfully:

1. Go to **Storage** in Supabase Dashboard
2. You should see both `listings` and `avatars` buckets
3. Try uploading an image through the MarketBridge app (create a listing or update profile)
4. Check the bucket - the image should appear there

## Image Upload Features

### Where Images Are Used:

1. **Listings** (`listings` bucket):
   - Create new product listings (up to 5 images)
   - Edit existing listings
   - Displayed on listing detail pages and browse pages

2. **Avatars** (`avatars` bucket):
   - User profile photos during onboarding
   - Displayed in header, chat, and dealer profiles

### Upload Specifications:

- **Supported formats**: JPG, PNG, WEBP
- **Max file size**: 5MB per image
- **Max images per listing**: 5
- **Max profile photos**: 1

## Troubleshooting

### "Failed to upload image" Error

**Possible causes:**
1. Buckets don't exist - Create them using the steps above
2. Buckets are not public - Enable "Public bucket" in settings
3. Missing storage policies - Run the SQL policies above
4. File too large - Compress image to under 5MB
5. Invalid file format - Use JPG, PNG, or WEBP

### Images Not Displaying

**Check:**
1. Bucket is set to "Public"
2. Image URL is correct (check in Supabase Storage)
3. Browser console for CORS errors
4. Network tab to see if image request failed

## Cost Considerations

Supabase Storage is free up to:
- **1GB storage**
- **2GB bandwidth** per month

For the beta, this should be more than sufficient. Monitor usage in the Supabase Dashboard under **Settings > Usage**.

## Security Notes

- Images are publicly accessible (no authentication required to view)
- Only authenticated users can upload images
- Users can only modify/delete their own uploads
- File size limits prevent abuse (5MB max)
- No executable files can be uploaded (only images)

---

**Setup complete!** Your MarketBridge app now supports real image uploads for listings and user profiles.
