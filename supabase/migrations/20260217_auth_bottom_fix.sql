-- BOTTOM-UP AUTH SYSTEM FIX
-- 1. Automate Profile Creation (Critical for Signup reliability)
-- 2. Sync auth metadata to public.users table

-- Create the function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        role, 
        display_name, 
        university, 
        phone_number,
        business_name,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'student_buyer'),
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'university',
        NEW.raw_user_meta_data->>'phone_number',
        NEW.raw_user_meta_data->>'business_name',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = COALESCE(EXCLUDED.role, users.role),
        display_name = COALESCE(EXCLUDED.display_name, users.display_name);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure school emails and official admin emails are auto-verified
CREATE OR REPLACE FUNCTION public.auto_verify_edu_ng()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-verify .edu.ng emails OR official @marketbridge.com.ng emails
    IF NEW.email ~* '^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?edu(\.ng)?$' OR 
       NEW.email ILIKE '%@marketbridge.com.ng' THEN
        UPDATE public.users 
        SET is_verified = TRUE, beta_status = 'approved'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_edu_user_created ON public.users;
CREATE TRIGGER on_edu_user_created
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_verify_edu_ng();
