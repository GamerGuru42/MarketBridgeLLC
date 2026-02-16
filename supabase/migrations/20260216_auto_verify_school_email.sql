-- Function to automatically verify sellers if they confirm a school email
CREATE OR REPLACE FUNCTION public.handle_school_email_verification()
RETURNS TRIGGER AS $$
DECLARE
  matching_user_id uuid;
BEGIN
  -- Check if the email is confirmed and matches the school email pattern
  -- The regex checks for .edu or .edu.ng
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.email ~* '^[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.)?edu(\.ng)?$' THEN
    
    -- Update the public.users table for this user if they are a seller
    UPDATE public.users
    SET 
      is_verified = true,
      subscription_status = 'trialing' -- Ensure they remain active/trialing
    WHERE id = NEW.id 
    AND role IN ('dealer', 'student_seller');
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for email confirmation
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_school_email_verification();
