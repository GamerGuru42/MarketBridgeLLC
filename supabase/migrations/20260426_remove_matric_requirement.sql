-- Migration: Remove Matric Number Requirement
-- Date: April 26, 2026

-- 1. Make matric_number nullable in users table
-- We use DO block to check if column exists and is not null before altering
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'matric_number' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.users ALTER COLUMN matric_number DROP NOT NULL;
    END IF;
END $$;

-- 2. Ensure roles are normalized (optional but good for consistency)
-- Any existing 'student_buyer' or 'student_seller' should be mapped to 'buyer' or 'seller'
UPDATE public.users SET role = 'buyer' WHERE role = 'student_buyer';
UPDATE public.users SET role = 'seller' WHERE role = 'student_seller';

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
