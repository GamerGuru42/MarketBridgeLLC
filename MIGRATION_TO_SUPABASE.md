# Migration to Supabase

This document outlines the plan to migrate the MarketBridge application from Firebase/MongoDB to Supabase.

## 1. Setup

- [x] Install Supabase client: `npm install @supabase/supabase-js`
- [x] Create `client/lib/supabase.ts` for client-side initialization.
- [ ] Configure environment variables in `.env.local`.

## 2. Authentication

- [x] Replace Firebase Auth with Supabase Auth in `client/contexts/AuthContext.tsx`.
- [x] Update Login page (`client/app/login/page.tsx`) to use Supabase Auth.
- [x] Update Signup page (`client/app/signup/page.tsx`) to use Supabase Auth.
- [x] Update Google Login to use Supabase OAuth.

## 3. Database (Postgres)

- [x] Create necessary tables in Supabase (Users, Listings, Orders, etc.) - See `supabase-schema.sql`.
- [ ] Migrate data if needed (or start fresh).
- [x] Update API routes or client-side code to query Supabase instead of MongoDB/Firebase.
  - [x] Users
  - [x] Listings
  - [x] Orders
  - [x] Reviews

## 4. Storage

- [x] Create Storage Buckets in Supabase (e.g., `listings`, `avatars`).
- [x] Update image upload logic to use Supabase Storage.

## 5. Cleanup

- [x] Remove Firebase and MongoDB dependencies.
- [x] Remove unused API routes.

## Required Credentials

To proceed, we need the following from your Supabase Project Settings > API:

1.  **Project URL**
2.  **anon public key**
3.  **service_role secret** (only if we need server-side admin access, otherwise anon key is enough for client)
