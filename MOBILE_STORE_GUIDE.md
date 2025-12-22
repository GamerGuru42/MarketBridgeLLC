# Mobile App & Play Store Guide

## Overview

Your MarketBridge web app has been converted into a **Progressive Web App (PWA)**. This means it can be installed on mobile devices and works offline.

To publish this to the **Google Play Store**, you don't need to rewrite it as a native Android app. You can package your PWA as a **Trusted Web Activity (TWA)**.

## Step 1: Deploy Your App

Ensure your latest code (with PWA features) is deployed to Vercel and live.
- URL example: `https://marketbridge.vercel.app`

## Step 2: Generate Android App Bundle (AAB)

We will use **PWABuilder**, a free tool by Microsoft.

1. Go to **[PWABuilder.com](https://www.pwabuilder.com/)**.
2. Enter your live website URL (e.g., `https://marketbridge.vercel.app`) and click **Start**.
3. It will analyze your site. You should see "Manifest" and "Service Worker" as **Ready**.
4. Click **Build My App**.
5. Choose **Android**.
6. Fill in the details:
   - **Package ID**: `com.marketbridge.app` (or similar)
   - **App Name**: MarketBridge
   - **Launcher Name**: MarketBridge
7. Click **Download**.
   - You will receive a `.zip` file containing your **Asset Links** file and your **Android App Bundle (.aab)**.

## Step 3: Digital Asset Links (Crucial)

For the app to verify it owns the website (and remove the browser address bar), you must upload the `assetlinks.json` file to your website.

1. Extract the downloaded zip from PWABuilder.
2. Find `assetlinks.json`.
3. Place this file in your project at: `client/public/.well-known/assetlinks.json`.
   - *Note: I have already created this folder for you.*
4. Commit and push this change to GitHub.
5. Redeploy to Vercel.

## Step 4: Google Play Console

1. Go to **[Google Play Console](https://play.google.com/console)**.
2. Create a Developer Account ($25 one-time fee).
3. **Create App**:
   - Enter App Name: "MarketBridge"
   - Language: English
   - App or Game: App
   - Free or Paid: Free
4. **Upload Bundle**:
   - Go to **Production** (or Internal Testing).
   - Upload the `.aab` file you downloaded from PWABuilder.
5. **Store Listing**:
   - Upload your App Icon (512x512).
   - Upload Screenshots (you can take these from your phone or browser).
   - Add Description.
6. **Privacy Policy**:
   - You need a privacy policy URL. You can use `https://marketbridge.vercel.app/privacy`.

## Step 5: Review & Publish

- Submit your app for review.
- Google usually takes 1-3 days to review.
- Once approved, your app will be live on the Play Store!

## Troubleshooting

- **"Digital Asset Links verification failed"**: Ensure `https://your-domain.com/.well-known/assetlinks.json` is accessible and matches the file from PWABuilder.
- **"App is not full screen"**: This usually means the asset links verification failed.

---

**Note**: This method is the industry standard for converting Next.js web apps to the Play Store. It ensures your mobile app is always up-to-date with your website without needing separate app updates.
