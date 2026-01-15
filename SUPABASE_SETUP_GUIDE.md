# Supabase Migration - Setup Instructions

## ✅ Completed Steps

1. **Environment Variables**: Updated `.env.local` with Supabase credentials
2. **Supabase Client**: Created `client/lib/supabase.ts`
3. **Auth Pages**: Updated Login and Signup pages to use Supabase Auth
4. **OAuth Callback**: Created `/auth/callback` route for Google OAuth
5. **Database Schema**: Created `supabase-schema.sql` with complete database structure

## 🔧 Next Steps - Database Setup

### Step 1: Create Database Tables in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `oubsxmokzeodggmanjez`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase-schema.sql` and paste it into the editor
6. Click **Run** to execute the SQL

This will create:
- All necessary tables (users, listings, orders, chats, messages, reviews)
- Indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp triggers

### Step 2: Configure Google OAuth Provider

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to enable it
3. You'll need to create a Google OAuth Client:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: Add `https://oubsxmokzeodggmanjez.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
4. Back in Supabase, paste the Client ID and Client Secret
5. Click **Save**

### Step 3: Test Authentication

1. The dev server is already running at http://localhost:3000
2. Go to http://localhost:3000/signup
3. Try creating an account with email/password
4. Try signing in with Google (after configuring OAuth)
5. Check the Supabase Dashboard > **Authentication** > **Users** to see created users

## 🔄 Migration Status

### ✅ Completed
- [x] Supabase client setup
- [x] Environment variables configured
- [x] Login page migrated to Supabase Auth
- [x] Signup page migrated to Supabase Auth
- [x] OAuth callback handler created
- [x] Database schema created
- [x] Dev server running successfully

### 🔄 In Progress
- [ ] Execute database schema in Supabase
- [ ] Configure Google OAuth provider
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test Google OAuth flow

### 📋 TODO
- [ ] Migrate listings API to use Supabase
- [ ] Migrate orders API to use Supabase
- [ ] Migrate wishlist to use Supabase
- [ ] Update AuthContext to use Supabase (or switch to SupabaseAuthContext)
- [ ] Remove Firebase dependencies
- [ ] Update Vercel environment variables

## 🚨 Important Notes

1. **Email Confirmation**: By default, Supabase requires email confirmation. You can disable this in:
   - Dashboard > Authentication > Settings > Email Auth
   - Turn off "Enable email confirmations"

2. **RLS Policies**: The schema includes Row Level Security policies to protect user data. Make sure these align with your business logic.

3. **Backward Compatibility**: The old Firebase code is still in place. Once Supabase is fully working, we can remove Firebase dependencies.

## 🧪 Testing Checklist

After completing the setup:

- [ ] Sign up with email/password works
- [ ] Login with email/password works
- [ ] Google OAuth signup works
- [ ] Google OAuth login works
- [ ] User profile is created in `users` table
- [ ] Dealer signup with subscription plan works
- [ ] Customer signup works

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase Dashboard > Logs for backend errors
3. Verify all environment variables are set correctly
4. Make sure the database schema was executed successfully
