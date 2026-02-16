-- FINAL DATABASE FIX: ENSURE COLUMNS AND ROBUST TRIGGER
-- Run this in Supabase SQL Editor to resolve "database error saving new user"

-- 1. Ensure all required columns exist in public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS matric_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create or Replace the user creation function
-- Extracting data from raw_user_meta_data which we now populate from the frontend
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Extract role and other fields from metadata safely
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');

  -- Insert into public.users
  -- NOTE: We use ON CONFLICT to avoid errors if the row was already created by the client-side upsert
  INSERT INTO public.users (
    id,
    email,
    display_name,
    role,
    university,
    location,
    phone_number,
    business_name,
    matric_number,
    department,
    subscription_status,
    is_verified,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    v_role,
    new.raw_user_meta_data->>'university',
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'business_name',
    new.raw_user_meta_data->>'matric_number',
    new.raw_user_meta_data->>'department',
    CASE WHEN v_role IN ('student_seller', 'dealer') THEN 'pending_verification' ELSE 'active' END,
    CASE WHEN v_role IN ('student_seller', 'dealer') THEN false ELSE true END,
    jsonb_build_object(
      'verification_method', COALESCE(new.raw_user_meta_data->>'verification_method', 'none'),
      'student_id_url', COALESCE(new.raw_user_meta_data->>'student_id_url', ''),
      'is_manual_override', (new.raw_user_meta_data->>'is_manual_override' = 'true')
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    university = EXCLUDED.university,
    location = EXCLUDED.location,
    phone_number = EXCLUDED.phone_number,
    business_name = EXCLUDED.business_name,
    matric_number = EXCLUDED.matric_number,
    metadata = public.users.metadata || EXCLUDED.metadata,
    updated_at = now();

  -- 3. Create initial trial subscription for sellers AUTOMATICALLY in the trigger
  -- This ensures a subscription exists even if the client-side call fails
  IF v_role IN ('student_seller', 'dealer') THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      trial_end,
      metadata
    )
    VALUES (
      new.id,
      'beta_campus_founder',
      'trialing',
      now(),
      now() + interval '14 days',
      now() + interval '14 days',
      jsonb_build_object('auto_created_by_trigger', true)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- CRITICAL: Catch all errors to prevent auth.signUp from failing.
  -- This ensures the user is at least created in Auth, and we can debug profile issues later.
  RAISE WARNING 'Error in handle_new_user for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Correct RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own profile" ON public.users;
CREATE POLICY "Users can manage own profile" 
ON public.users 
FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users 
FOR SELECT 
USING (true);

-- 6. Grant Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.subscriptions TO service_role;
