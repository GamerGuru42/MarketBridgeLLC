# MarketBridge - GitHub & Vercel Deployment Guide

## 📋 Prerequisites
- Git installed on your system
- GitHub account
- Vercel account (sign up at https://vercel.com)

---

## 🔄 Step 1: Push to New GitHub Repository

### Option A: Using Git Command Line

1. **Open Terminal/PowerShell** in the project directory:
   ```
   C:\Users\CBY22\.gemini\antigravity\scratch\Marketbridge
   ```

2. **Check if Git is initialized** (if not, initialize it):
   ```bash
   git init
   ```

3. **Remove old remote** (if exists):
   ```bash
   git remote remove origin
   ```

4. **Add new GitHub repository**:
   ```bash
   git remote add origin https://github.com/isaacchrist/MarketBridge.git
   ```

5. **Stage all files**:
   ```bash
   git add .
   ```

6. **Commit changes**:
   ```bash
   git commit -m "Initial commit - MarketBridge with Supabase integration"
   ```

7. **Push to GitHub**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Option B: Using GitHub Desktop

1. Open GitHub Desktop
2. Click "Add" → "Add Existing Repository"
3. Browse to: `C:\Users\CBY22\.gemini\antigravity\scratch\Marketbridge`
4. Click "Add Repository"
5. Go to Repository → Repository Settings
6. Change the remote URL to: `https://github.com/isaacchrist/MarketBridge.git`
7. Click "Publish branch" or "Push origin"

### Option C: Using VS Code

1. Open the project in VS Code
2. Click the Source Control icon (left sidebar)
3. Click "Initialize Repository" if needed
4. Stage all changes (click the + icon)
5. Enter commit message: "Initial commit - MarketBridge with Supabase integration"
6. Click "Commit"
7. Click "..." → "Remote" → "Add Remote"
8. Enter: `https://github.com/isaacchrist/MarketBridge.git`
9. Name it: `origin`
10. Click "..." → "Push"

---

## 🚀 Step 2: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Sign in with GitHub

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Find and select: `isaacchrist/MarketBridge`
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**:
   Click "Environment Variables" and add the following:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **Where to find these values:**
   - Go to your Supabase Dashboard
   - Select your project
   - Go to Settings → API
   - Copy "Project URL" and "anon/public" key

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete (2-3 minutes)
   - You'll get a URL like: `https://marketbridge-xxx.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to client directory**:
   ```bash
   cd client
   ```

4. **Deploy**:
   ```bash
   vercel
   ```

5. **Follow prompts**:
   - Set up and deploy? Yes
   - Which scope? (Select your account)
   - Link to existing project? No
   - What's your project's name? MarketBridge
   - In which directory is your code located? ./
   - Want to override settings? No

6. **Add environment variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

7. **Deploy to production**:
   ```bash
   vercel --prod
   ```

---

## 🔐 Step 3: Configure Supabase for Production

1. **Update Supabase Authentication Settings**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to "Site URL": `https://your-app.vercel.app`
   - Add redirect URLs:
     ```
     https://your-app.vercel.app/auth/callback
     https://your-app.vercel.app/**
     ```

2. **Configure Google OAuth** (if using):
   - Go to Authentication → Providers → Google
   - Add your Vercel domain to "Authorized redirect URIs"

3. **Update CORS Settings** (if needed):
   - Go to Settings → API
   - Add your Vercel domain to allowed origins

---

## 📝 Step 4: Verify Deployment

1. **Visit your Vercel URL**
2. **Test the following**:
   - ✅ Homepage loads
   - ✅ Can browse listings
   - ✅ Can sign up/login
   - ✅ Can view listing details
   - ✅ Reviews display correctly
   - ✅ Wishlist functionality works

---

## 🔧 Troubleshooting

### Issue: Build fails on Vercel

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility

### Issue: Environment variables not working

**Solution:**
1. Redeploy after adding environment variables
2. Ensure variable names start with `NEXT_PUBLIC_` for client-side access
3. Check for typos in variable names

### Issue: Supabase connection fails

**Solution:**
1. Verify environment variables are correct
2. Check Supabase project is not paused
3. Verify Supabase URL configuration includes Vercel domain

### Issue: Authentication redirect fails

**Solution:**
1. Add Vercel URL to Supabase redirect URLs
2. Update `redirectTo` in auth code to use production URL
3. Clear browser cache and try again

---

## 📊 Post-Deployment Checklist

- [ ] GitHub repository updated with latest code
- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] Supabase authentication URLs updated
- [ ] Homepage accessible
- [ ] User signup/login working
- [ ] Listings displaying correctly
- [ ] Database queries functioning
- [ ] Reviews system working
- [ ] Wishlist functionality operational

---

## 🔄 Future Updates

To deploy updates:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. **Vercel auto-deploys**:
   - Vercel automatically detects the push
   - Builds and deploys the new version
   - No manual action needed!

---

## 📞 Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs

---

## 🎉 Success!

Once deployed, your MarketBridge application will be live at:
`https://your-custom-name.vercel.app`

You can also add a custom domain in Vercel settings!

---

**Deployment Date:** December 3, 2025  
**Repository:** https://github.com/isaacchrist/MarketBridge.git  
**Status:** Ready for deployment
