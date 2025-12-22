# Quick Deployment Commands

## 🚀 Push to GitHub (New Repository)

Run these commands in order from the project root directory:

```bash
# Navigate to project directory
cd C:\Users\CBY22\.gemini\antigravity\scratch\Marketbridge

# Initialize Git (if not already done)
git init

# Remove old remote (if exists)
git remote remove origin

# Add new GitHub repository
git remote add origin https://github.com/isaacchrist/MarketBridge.git

# Stage all files
git add .

# Commit
git commit -m "Initial commit - MarketBridge with Supabase integration"

# Set main branch and push
git branch -M main
git push -u origin main
```

---

## 🌐 Deploy to Vercel

### Option 1: Via Vercel Dashboard (Easiest)
1. Go to https://vercel.com/new
2. Import from GitHub: `isaacchrist/MarketBridge`
3. Set Root Directory: `client`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

### Option 2: Via CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Navigate to client directory
cd client

# Deploy
vercel --prod
```

---

## 📋 Environment Variables Needed

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Settings → API

---

## ✅ After Deployment

Update Supabase redirect URLs:
1. Supabase Dashboard → Authentication → URL Configuration
2. Add: `https://your-app.vercel.app/auth/callback`
3. Add: `https://your-app.vercel.app/**`

---

**That's it! Your app will be live! 🎉**
