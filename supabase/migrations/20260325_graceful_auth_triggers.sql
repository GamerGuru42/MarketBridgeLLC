-- Graceful Auth Triggers
-- Wraps the triggers in exception blocks so that if public.users fails, auth.users STILL commits successfully

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        INSERT INTO public.users (
            id, email, role, display_name, university, phone_number, business_name, created_at
        ) VALUES (
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
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user failed for ID %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.auto_verify_edu_ng()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        IF NEW.email ~* '^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.)?edu(\.ng)?$' OR 
           NEW.email ILIKE '%@marketbridge.com.ng' THEN
            UPDATE public.users 
            SET is_verified = TRUE, beta_status = 'approved'
            WHERE id = NEW.id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'auto_verify_edu_ng failed for ID %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
