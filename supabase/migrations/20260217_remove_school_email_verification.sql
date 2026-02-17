-- Remove School Email (.edu.ng) Auto-Verification
-- Keep only @marketbridge.com.ng and admin role auto-verification

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auto_verify_accounts ON public.users;
DROP FUNCTION IF EXISTS public.auto_verify_accounts();

-- Create updated function without .edu.ng verification
CREATE OR REPLACE FUNCTION public.auto_verify_accounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-verify:
    -- 1. @marketbridge.com.ng emails (staff/internal)
    -- 2. CEO and all admin roles
    IF NEW.email ILIKE '%@marketbridge.com.ng' OR
       NEW.role IN ('ceo', 'admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'cto', 'coo', 'cofounder') THEN
        
        UPDATE public.users 
        SET is_verified = TRUE, beta_status = 'approved'
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auto_verify_accounts
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_verify_accounts();
