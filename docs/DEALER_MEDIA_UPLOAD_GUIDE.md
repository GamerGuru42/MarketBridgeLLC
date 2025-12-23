# Dealer Media Upload Guide

## Overview
MarketBridge now supports both **image** and **video** uploads for your listings, allowing you to showcase your products in the best possible way.

## Image Upload

### Features
- **Maximum Images**: 5 images per listing
- **Supported Formats**: JPG, PNG, WEBP
- **Maximum File Size**: 5MB per image
- **Storage**: Securely stored in Supabase Storage

### How to Upload Images
1. Navigate to **Create New Listing** or **Edit Listing**
2. Scroll to the **Product Images** section
3. Click on the **Upload Image** button
4. Select one or multiple images from your device
5. Images will be automatically uploaded and displayed
6. You can remove any image by hovering over it and clicking the **X** button

### Best Practices for Images
- Use high-quality, well-lit photos
- Show the product from multiple angles
- Include close-ups of important features
- Ensure the first image is the most attractive (it will be the thumbnail)
- For cars: Include exterior, interior, engine bay, and any special features

## Video Upload

### Features
- **Maximum Videos**: 3 videos per listing
- **Supported Formats**: MP4, MOV, AVI, WEBM
- **Maximum File Size**: 50MB per video
- **Storage**: Securely stored in Supabase Storage

### How to Upload Videos
1. Navigate to **Create New Listing** or **Edit Listing**
2. Scroll to the **Product Videos** section
3. Click on the **Upload Video** button
4. Select one or multiple videos from your device
5. Videos will be automatically uploaded and displayed with a preview
6. You can remove any video by hovering over it and clicking the **X** button

### Best Practices for Videos
- Keep videos short and focused (30-90 seconds recommended)
- Show the product in action
- For cars: Include a walkaround, interior tour, and engine sound
- Use good lighting and stable camera work
- Add a brief narration explaining key features
- Compress videos before uploading to stay under the 50MB limit

## Technical Details

### Database Schema
The `listings` table now includes:
- `images`: TEXT[] - Array of image URLs
- `videos`: TEXT[] - Array of video URLs (optional)

### Storage Buckets
- **Images**: `listings` bucket
- **Videos**: `listings-videos` bucket

### Security
- All uploads are validated for file type and size
- Only authenticated dealers can upload media
- Row Level Security (RLS) policies ensure dealers can only modify their own listings

## Troubleshooting

### Common Issues

**"File is too large"**
- Images: Compress your image to under 5MB
- Videos: Use a video compressor to reduce file size to under 50MB

**"File is not an image/video"**
- Ensure you're uploading the correct file format
- Supported image formats: JPG, PNG, WEBP
- Supported video formats: MP4, MOV, AVI, WEBM

**Upload Failed**
- Check your internet connection
- Try uploading one file at a time
- Clear your browser cache and try again
- Contact support if the issue persists

## Migration

If you have existing listings, they will continue to work normally. The `videos` field is optional, so you can add videos to existing listings by editing them.

To add the videos column to your existing database, run:
```sql
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS videos TEXT[];
```

## Support

For any issues or questions about media uploads, please contact:
- Email: support@marketbridge.com
- Phone: +234 800 000 0000
- Live Chat: Available in your dealer dashboard
