-- ============================================
-- ONBOARDING & SUBSCRIPTION DATABASE FIX
-- ============================================
-- Step 1: Add missing columns for Dealer Onboarding and Trial Management
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS cac_number TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS store_type TEXT;

-- Step 2: Update the subscription_status check constraint
-- This allows for 'pending_payment' and 'expired' states
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_subscription_status_check 
CHECK (subscription_status IN ('inactive', 'trial', 'active', 'cancelled', 'pending_payment', 'expired'));

-- Step 3: Update store_type check constraint (if not already there)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_store_type_check;
ALTER TABLE public.users ADD CONSTRAINT users_store_type_check 
CHECK (store_type IN ('physical', 'online', 'both'));

-- Step 4: Fix the handle_new_user trigger to respect metadata role
-- This prevents all signups from accidentally becoming 'customer'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_role TEXT;
BEGIN
  -- Extract role from metadata, default to 'customer'
  initial_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  -- Extract full_name/display_name from metadata
  -- This matches our auth.signUp call structure
  INSERT INTO public.users (
    id, 
    email, 
    display_name, 
    role, 
    photo_url,
    location,
    phone_number
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    initial_role,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 5: Ensure RLS allows the upsert from the client
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- DONE! Run this in Supabase SQL Editor.
-- ============================================
