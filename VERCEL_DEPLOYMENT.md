# Deploying Marketbridge to Vercel (Firebase-Only Setup)

Your app now uses **Firebase Firestore only** - no MongoDB needed! This makes deployment super simple.

## Prerequisites

- GitHub repository with your code
- Vercel account (https://vercel.com)
- **Existing Firebase project** (you already have this!)
- Flutterwave account

## Step 1: Install Dependencies

```bash
cd client
npm install jose bcryptjs firebase-admin @types/bcryptjs
```

**Note**: No `mongodb` package needed!

## Step 2: Set Up Environment Variables

Create `.env.local` in the `client` directory:

```env
# Client-side (from your existing Firebase project)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:...

# Server-side (Firebase Admin SDK - from same project)
JWT_SECRET=your_very_long_random_secret
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nKey\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-...
FLUTTERWAVE_SECRET_KEY=FLWSECK-...
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST...
```

## Step 3: Test Locally

```bash
cd client
npm run dev
```

Visit http://localhost:3000 and test:
- ✅ User registration
- ✅ User login
- ✅ Google OAuth
- ✅ Browse listings
- ✅ Create listing (as dealer)
- ✅ Wishlist

## Step 4: Deploy to Vercel

### Using Vercel Dashboard (Easiest)

1. **Go to [vercel.com](https://vercel.com)** → Sign in with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your Marketbridge repository

3. **Configure Settings**
   - **Root Directory**: `client` ⚠️ **CRITICAL!**
   - **Framework**: Next.js (auto-detected)
   - Leave other settings as default

4. **Add Environment Variables**
   
   Click "Environment Variables" and add ALL variables from your `.env.local`:
   
   - Copy each variable name and value
   - Select "Production", "Preview", and "Development"
   - Click "Add" for each one

5. **Deploy**
   - Click "Deploy"
   - Wait 2-4 minutes
   - Get your URL: `https://your-app.vercel.app`

## Step 5: Update Firebase

Add your Vercel domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. **Authentication → Settings → Authorized domains**
4. Click "Add domain"
5. Add: `your-app.vercel.app`
6. Also add: `*.vercel.app` (for preview deployments)

## What's Different from MongoDB Setup?

✅ **Simpler**: Only one database (Firebase)
✅ **Cheaper**: No MongoDB subscription
✅ **Faster**: No external database connection
✅ **Easier**: Uses your existing Firebase project

## Firestore Structure

Your existing Firebase project will have these collections:

```
firestore/
├── users/              ← Already exists
├── listings/           ← New (created automatically)
├── orders/             ← New
├── chats/              ← New
├── reviews/            ← New
└── escrow/             ← New
```

Collections are created automatically when you add data!

## Automatic Deployments

Push to GitHub → Vercel auto-deploys:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## Troubleshooting

### Build Fails

**"Cannot find module 'jose'"**
- Run: `npm install jose bcryptjs firebase-admin`
- Push to GitHub
- Redeploy

**"Root directory not found"**
- Vercel Settings → General → Root Directory → Set to `client`

### Runtime Errors

**"Firebase: unauthorized-domain"**
- Add Vercel domain to Firebase authorized domains
- Wait 2-3 minutes

**API routes return 500**
- Check Vercel Functions logs
- Verify Firebase credentials in environment variables
- Make sure `FIREBASE_PRIVATE_KEY` has proper newlines

## Monitoring

- **Vercel Dashboard**: Deployment logs, function logs
- **Firebase Console**: Database usage, authentication
- **Browser Console**: Frontend errors

## Cost

- **Vercel**: Free tier (generous limits)
- **Firebase**: Free tier (Spark plan) or Blaze (pay-as-you-go)
- **Total**: Can run for free or very cheap!

---

**Your deployment**: One command, one platform, one database! 🚀

Everything deploys to Vercel, everything uses your existing Firebase project.
