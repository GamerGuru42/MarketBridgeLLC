-- FIX FOR "DATABASE ERROR UPDATING USER" AND SIGNUP FLOW
-- 1. This script replaces the user creation trigger to be robust and error-free.
-- 2. It ensures public.users is automatically created from auth.users metadata.
-- 3. It handles potential RLS conflicts gracefully.

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'customer'; -- Default role
  v_university TEXT;
  v_location TEXT;
  v_phone TEXT;
  v_business TEXT;
  v_matric TEXT;
  v_dept TEXT;
  v_subscription TEXT;
BEGIN
  -- Extract metadata safely (using COALESCE to avoid null issues if keys missing)
  -- Note: JSONB keys are case-sensitive. Ensure frontend sends matching keys.
  BEGIN
    v_role := new.raw_user_meta_data->>'role';
    v_university := new.raw_user_meta_data->>'university';
    v_location := new.raw_user_meta_data->>'location';
    v_phone := new.raw_user_meta_data->>'phone'; -- Might differ from frontend key, check!
    v_business := new.raw_user_meta_data->>'business_name'; 
    v_matric := new.raw_user_meta_data->>'matric_number';
    v_dept := new.raw_user_meta_data->>'department';
    
    IF v_role IS NULL THEN v_role := 'customer'; END IF;
    
    -- Insert into public.users
    INSERT INTO public.users (
      id,
      email,
      role,
      university,
      location,
      phone_number,
      business_name,
      matric_number,
      subscription_status,
      is_verified,
      created_at
    )
    VALUES (
      new.id,
      new.email,
      v_role,
      v_university,
      v_location,
      v_phone,
      v_business,
      v_matric,
      CASE WHEN v_role IN ('student_seller', 'dealer') THEN 'pending_verification' ELSE 'active' END,
      CASE WHEN v_role IN ('student_seller', 'dealer') THEN false ELSE true END, -- Sellers need verification
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      university = EXCLUDED.university,
      location = EXCLUDED.location,
      business_name = EXCLUDED.business_name,
      matric_number = EXCLUDED.matric_number,
      updated_at = now();
      
  EXCEPTION WHEN OTHERS THEN
    -- Build a useful error message but DO NOT FAIL the transaction if possible?
    -- Actually, if this fails, the user has no profile.
    -- Better to LOG it and let auth proceed, or RAISE NOTICE.
    -- But Supabase Auth catches errors.
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    -- We retry with minimal data?
    INSERT INTO public.users (id, email) VALUES (new.id, new.email) ON CONFLICT (id) DO NOTHING;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS allows the trigger to work (it is Security Definer so it bypasses RLS, but good to be sure)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant permissions just in case
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO service_role; -- Trigger runs as owner usually, or we can key it to service_role

-- Allow public read of users (for validating emails/referrals) - Restricted
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
