-- COMPREHENSIVE ADMIN & VERIFICATION FIX
-- 1. Auto-verify CEO and all admin roles on account creation
-- 2. Fix admin chat RLS policies for operations_admin
-- 3. Update auto-verification logic

-- ========================================
-- PART 1: Auto-Verify Admin & CEO Accounts
-- ========================================

-- Drop and recreate the auto-verification function
DROP TRIGGER IF EXISTS on_edu_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auto_verify_accounts ON public.users;
DROP FUNCTION IF EXISTS public.auto_verify_edu_ng();
DROP FUNCTION IF EXISTS public.auto_verify_accounts();

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

-- ========================================
-- PART 2: Fix Admin Chat RLS Policies
-- ========================================

-- Drop old restrictive insert policy
DROP POLICY IF EXISTS "Admins can insert messages" ON admin_channel_messages;

-- Create new policy that explicitly allows all admin roles
CREATE POLICY "Admins can insert messages" ON admin_channel_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN (
                'admin', 
                'technical_admin', 
                'operations_admin', 
                'marketing_admin', 
                'cto', 
                'coo', 
                'ceo', 
                'cofounder'
            )
        )
    );

-- Also update the view policy to explicitly check admin roles
DROP POLICY IF EXISTS "Admins can view messages" ON admin_channel_messages;

CREATE POLICY "Admins can view messages" ON admin_channel_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN (
                'admin', 
                'technical_admin', 
                'operations_admin', 
                'marketing_admin', 
                'cto', 
                'coo', 
                'ceo', 
                'cofounder'
            )
        )
    );

-- Update channels view policy
DROP POLICY IF EXISTS "Admins can view channels" ON admin_channels;

CREATE POLICY "Admins can view channels" ON admin_channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN (
                'admin', 
                'technical_admin', 
                'operations_admin', 
                'marketing_admin', 
                'cto', 
                'coo', 
                'ceo', 
                'cofounder'
            )
        )
    );

-- ========================================
-- PART 3: Retroactively Verify Existing CEO/Admin Accounts
-- ========================================

-- Verify all existing CEO and admin accounts
UPDATE public.users
SET is_verified = TRUE, beta_status = 'approved'
WHERE role IN (
    'ceo', 
    'admin', 
    'technical_admin', 
    'operations_admin', 
    'marketing_admin', 
    'cto', 
    'coo', 
    'cofounder'
)
AND is_verified = FALSE;
