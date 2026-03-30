-- Forcefully Nuke and Replace Role Constraints on public.users
-- Date: 2026-03-25
-- Description: Dynamically finds and drops any CHECK constraint on the `role` column, regardless of its auto-generated name.

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Loop through all check constraints on the public.users table that involve the 'role' column
    FOR constraint_record IN 
        SELECT con.conname 
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
        INNER JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
        WHERE nsp.nspname = 'public' 
          AND rel.relname = 'users' 
          AND con.contype = 'c' -- 'c' stands for CHECK constraint
          AND a.attname = 'role'
    LOOP
        -- Execute a DROP statement for each matching constraint
        EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(constraint_record.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Now add the correct, inclusive constraint and ensure it is named explicitly
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
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
        WHERE nsp.nspname = 'public' 
          AND rel.relname = 'users' 
          AND con.conname = 'users_role_check'
    ) THEN 
        RAISE EXCEPTION 'users_role_check constraint was not created successfully!'; 
    ELSE
        RAISE NOTICE 'SUCCESS: Role constraint is fully updated.';
    END IF; 
END $$;
