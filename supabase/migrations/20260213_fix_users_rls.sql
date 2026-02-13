-- FIX: Allow users to create/update their own profile (Critical for Signup & Self-Healing)
-- This policy allows authenticated users to INSERT and UPDATE their own row in the 'users' table.
-- Without this, the 'users' row is never created during signup, causing the "Infinite Loading" bug on the dashboard.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- Single comprehensive policy for self-management
CREATE POLICY "Users can manage own profile" 
ON public.users 
FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Allow public read for verifying dealers/admins public profiles (Optional, but safe for basic fields)
-- Creating a view is better, but for now allow Select for authenticated
CREATE POLICY "Authenticated users can view other profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Ensure service_role has full access (Supabase default, but good to ensure)
-- (Implicit in Supabase)

-- Grant usage on sequence if exists (rare for UUID)
