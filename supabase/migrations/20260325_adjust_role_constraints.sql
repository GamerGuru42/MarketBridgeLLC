-- Adjust role constraints to allow student_seller and student_buyer
-- Date: 2026-03-25

-- First, drop the existing constraint if possible. 
-- Since it was likely defined inline, we might need to find its name or drop by type.
-- In Supabase, inline constraints are often named like 'users_role_check'

DO $$ 
BEGIN 
    -- Try to drop the constraint if it exists
    ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_role_check;
END $$;

-- Add the new, expanded constraint
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN (
    'customer', 
    'dealer', 
    'admin', 
    'ceo', 
    'cofounder', 
    'cto', 
    'coo', 
    'technical_admin', 
    'operations_admin', 
    'marketing_admin',
    'student_seller',
    'student_buyer'
));

-- Verify the migration
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE table_name = 'users' AND constraint_name = 'users_role_check'
    ) THEN 
        RAISE EXCEPTION 'users_role_check constraint was not created'; 
    END IF; 
END $$;
