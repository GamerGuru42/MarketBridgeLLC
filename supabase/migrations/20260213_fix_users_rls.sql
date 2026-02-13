-- FIX: Allow users to create/update their own profile (Critical for Signup & Self-Healing)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Safely Drop ALL conflicting policies first
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Authenticated users can view other profiles" ON public.users;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- 1. Single comprehensive policy for self-management (Insert/Update/Select own)
CREATE POLICY "Users can manage own profile" 
ON public.users 
FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 2. Allow authenticated users to view other profiles (Required for some lookups)
CREATE POLICY "Authenticated users can view other profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);
