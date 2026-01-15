-- ==============================================================================
-- RESET PROTOCOL: DELETE CEO ACCOUNT
-- ==============================================================================
-- This script deletes the user 'ceo@marketbridge.io' from both the Identity Layer (Auth)
-- and the Public Data Layer (Users table).
--
-- INSTRUCTIONS:
-- 1. Copy the code below.
-- 2. Go to your Supabase Dashboard -> SQL Editor.
-- 3. Paste and Run.
-- ==============================================================================

-- 1. Identify valid user ID
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'ceo@marketbridge.io';

    IF target_user_id IS NOT NULL THEN
        -- 2. Delete from Public Table (Cascade should handle relations, but explicit is safer)
        DELETE FROM public.users WHERE id = target_user_id;
        
        -- 3. Delete from Auth Table (This is the critical one for Signup reset)
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RAISE NOTICE 'CEO Account (ID: %) has been successfully terminated.', target_user_id;
    ELSE
        RAISE NOTICE 'No CEO account found for ceo@marketbridge.io';
    END IF;
END $$;
