-- ============================================
-- 14. ADMIN ACCESS & SECURITY FIXES
-- ============================================

-- Function to check admin status securely (bypassing RLS recursion)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_role text;
BEGIN
    -- This function skips RLS so it's safer for internal checks
    -- SECURITY DEFINER allows this function to execute as 'supabase_admin' or table owner
    SELECT role INTO current_role FROM users WHERE id = auth.uid();
    RETURN current_role IN ('admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cto', 'coo', 'cofounder');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on users table if not already
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users 
FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (auth.uid() = id);

-- 3. Admins can read ALL profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON users;
CREATE POLICY "Admins can read all profiles" ON users 
FOR SELECT USING (check_is_admin());

-- 4. Admins can update ALL profiles (e.g. verify/ban)
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;
CREATE POLICY "Admins can update all profiles" ON users 
FOR UPDATE USING (check_is_admin());

-- 5. Public can read basic dealer info (for marketplace listings)
-- We restrict this to only 'dealer' roles to prevent scraping all user emails
DROP POLICY IF EXISTS "Public can read dealer profiles" ON users;
CREATE POLICY "Public can read dealer profiles" ON users 
FOR SELECT USING (role IN ('dealer', 'student_seller'));

-- 6. Grant execute permissions explicitly
GRANT EXECUTE ON FUNCTION check_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_admin TO service_role;
