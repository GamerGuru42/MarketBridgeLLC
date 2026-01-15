# New Supabase Project Setup

## 🔐 Credentials for New Supabase Project

**Supabase URL:** `https://gbengxoscojwmpbirgtp.supabase.co`

**Supabase Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZW5neG9zY29qd21wYmlyZ3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjY2MjAsImV4cCI6MjA4MDM0MjYyMH0.el3oNDneyZWXvKFhKBiRVm7UmXGLpJeQn5pgRk7JT6U`

---

## 📋 Step 1: Update Local Environment Variables

1. Open the file: `client/.env.local`
2. Replace the contents with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gbengxoscojwmpbirgtp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZW5neG9zY29qd21wYmlyZ3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjY2MjAsImV4cCI6MjA4MDM0MjYyMH0.el3oNDneyZWXvKFhKBiRVm7UmXGLpJeQn5pgRk7JT6U
```

---

## 🗄️ Step 2: Set Up Database Schema

You need to run these SQL scripts in your new Supabase project:

### Go to Supabase Dashboard:
1. Visit: https://supabase.com/dashboard
2. Select your project: `gbengxoscojwmpbirgtp`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Run these scripts IN ORDER:

#### Script 1: Main Schema (`supabase-schema.sql`)
Copy and paste the entire contents of `supabase-schema.sql` and click **Run**

#### Script 2: Seed Data (`SEED_DATA.sql`)
Copy and paste the entire contents of `SEED_DATA.sql` and click **Run**

#### Script 3: Wishlist Table (`WISHLIST_SETUP.sql`)
Copy and paste the entire contents of `WISHLIST_SETUP.sql` and click **Run**

---

## 🚀 Step 3: Vercel Environment Variables

When deploying to Vercel, add these environment variables:

**Variable 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://gbengxoscojwmpbirgtp.supabase.co`

**Variable 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZW5neG9zY29qd21wYmlyZ3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjY2MjAsImV4cCI6MjA4MDM0MjYyMH0.el3oNDneyZWXvKFhKBiRVm7UmXGLpJeQn5pgRk7JT6U`

---

## ✅ Step 4: Configure Supabase Authentication

After deploying to Vercel, update these settings in Supabase:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g., `https://marketbridge-xxx.vercel.app`)
3. Add **Redirect URLs:**
   - `https://your-vercel-url.vercel.app/auth/callback`
   - `https://your-vercel-url.vercel.app/**`

---

## 🔄 Quick Checklist

- [ ] Update `client/.env.local` with new credentials
- [ ] Run `supabase-schema.sql` in Supabase SQL Editor
- [ ] Run `SEED_DATA.sql` in Supabase SQL Editor  
- [ ] Run `WISHLIST_SETUP.sql` in Supabase SQL Editor
- [ ] Add environment variables in Vercel
- [ ] Deploy to Vercel
- [ ] Update Supabase redirect URLs with Vercel URL
- [ ] Test the deployed app

---

**Project ID:** `gbengxoscojwmpbirgtp`  
**Region:** Auto-detected  
**Status:** Ready for setup
