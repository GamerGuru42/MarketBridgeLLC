# Beta Images & Dealer Upload Feature Plan

## Current Status

### Image Generation Issue
- **Status**: Image generation quota exhausted (429 error)
- **Quota Reset**: Approximately 4 hours from 06:14 AM (around 10:17 AM)
- **Current Solution**: Using emoji placeholders (working fine for beta)

## Options for Product Images

### Option 1: Wait for Quota Reset
- Retry image generation after ~4 hours
- Generate all 10 images (6 categories + 4 featured products)
- Update homepage to use generated images

### Option 2: Use Free Stock Images (Recommended for Quick Deploy)
Download images from these trusted sources:

**Unsplash** (https://unsplash.com):
- Search terms: "electronics", "fashion nigeria", "home decor", "car parts", "beauty products", "sports equipment"
- Free to use without attribution

**Pexels** (https://pexels.com):
- Similar search terms
- High-quality, royalty-free images

**Steps to Add Stock Images**:
1. Download images and save to `client/public/images/`
2. Name them according to the schema:
   - `electronics.jpg`
   - `fashion.jpg`
   - `home-garden.jpg`
   - `automotive.jpg`
   - `beauty.jpg`
   - `sports.jpg`
   - `iphone-15-pro.jpg`
   - `toyota-camry.jpg`
   - `macbook-pro.jpg`
   - `ps5-console.jpg`
3. Update `client/app/(main)/page.tsx` to reference image files instead of emojis

### Option 3: Keep Emojis for Beta
- Current implementation works well
- Clean, minimal design
- No download/loading time
- Can add real images in full release

## Dealer Image Upload Feature (Main App)

### Overview
In the full release, dealers will be able to upload their own product images directly through the platform.

### Planned Features

#### 1. Dealer Dashboard - Image Upload Interface
**Location**: `/dealer/listings/new` and `/dealer/listings/[id]/edit`

**Features**:
- Drag-and-drop image upload
- Multi-image support (up to 8 images per listing)
- Image preview before upload
- Crop/resize functionality
- Automatic image optimization
- Progress indicators

#### 2. Image Management
**File Requirements**:
- Formats: JPEG, PNG, WebP
- Max size: 5MB per image
- Recommended dimensions: 1200x1200px (square aspect ratio)
- Automatic compression to optimize load times

**Storage Solution**:
- **Option A**: Firebase Storage (already integrated)
  - Pros: Already in stack, easy integration with Firestore
  - Pricing: Free tier: 5GB storage, 1GB/day downloads
  
- **Option B**: Cloudinary
  - Pros: CDN, image transformations, optimizations
  - Pricing: Free tier: 25GB storage, 25GB bandwidth/month
  
- **Recommended**: Firebase Storage (simpler, already configured)

#### 3. In-App Guide for Dealers

**Multi-step Onboarding Tutorial**:
1. **Welcome Screen**: Overview of listing creation process
2. **Image Tips**: Best practices for product photos
   - Good lighting
   - Clear product visibility
   - Multiple angles
   - Clean background
3. **Upload Demo**: Interactive guide showing:
   - How to select images
   - How to reorder images
   - How to set primary image
   - How to delete/replace images
4. **Quality Checklist**: Before publishing
   - Checklist of image requirements
   - Warning for blurry/dark images
   - Suggestions for improvement

**Guide Features**:
- Tooltips on first visit
- Help button with video tutorials
- "Best Practices" section in dealer dashboard
- Example listings showcase

#### 4. Image Validation & Quality Control

**Automatic Checks**:
- Image dimensions (minimum 600x600px)
- File size validation
- Format verification
- Basic quality check (not too dark/blurry)

**Admin Review** (optional):
- Flagging inappropriate images
- Quality standards enforcement
- Watermark removal detection

### Technical Implementation Plan

#### Frontend Components
```
dealer/listings/new/
  ├── ImageUploader.tsx         # Drag-drop upload component
  ├── ImagePreview.tsx           # Preview grid with reorder
  ├── ImageEditor.tsx            # Crop/rotate functionality
  └── UploadGuide.tsx            # Tutorial overlay

components/
  ├── ImageCompression.ts        # Client-side compression
  └── UploadProgress.tsx         # Progress indicator
```

#### Backend API Endpoints
```
POST /api/listings/:id/images      # Upload image
DELETE /api/listings/:id/images/:imageId  # Delete image
PUT /api/listings/:id/images/order # Reorder images
```

#### Database Schema Update
```javascript
// listings collection
{
  images: [
    {
      id: 'uuid',
      url: 'firebase-storage-url',
      thumbnailUrl: 'optimized-thumbnail-url',
      order: 0,  // Primary image
      uploadedAt: timestamp,
      size: bytes,
      dimensions: { width: 1200, height: 1200 }
    }
  ]
}
```

### Timeline for Implementation

**Phase 1** (Beta - Current):
- ✅ Use emoji placeholders or stock images
- ✅ Static product images

**Phase 2** (Main App Release):
- Week 1-2: Firebase Storage integration
- Week 2-3: Image upload UI components
- Week 3-4: Image editor and optimization
- Week 4-5: In-app guide and tutorials
- Week 5-6: Admin review tools
- Week 6-7: Testing and refinement

### Resources Needed

1. **Firebase Storage Setup**:
   - Enable Firebase Storage in project
   - Configure security rules
   - Set up storage buckets

2. **Libraries**:
   - `react-dropzone` - File upload
   - `react-image-crop` - Image cropping
   - `browser-image-compression` - Client-side compression
   - `react-sortable-hoc` - Image reordering

3. **Documentation**:
   - Dealer image upload guide
   - API documentation
   - Best practices document with examples

## Next Steps for Beta

### Immediate (Current Session):
1. ✅ Keep emoji placeholders for now OR
2. Manually add stock images if desired

### After Quota Reset (~4 hours):
1. Generate images using AI
2. Update homepage to use generated images
3. Commit and push changes
4. Deploy to Vercel

### For Main App:
1. Implement Firebase Storage integration
2. Build dealer image upload interface
3. Create in-app tutorial/guide
4. Add image management features
5. Implement quality controls

---

**Note**: The current emoji implementation works perfectly for beta. Real product images can wait for the full release when dealers will upload their own photos.
