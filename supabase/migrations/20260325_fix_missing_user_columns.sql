-- Add missing columns to public.users to fix trigger failures
-- Date: 2026-03-25

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Verify the columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'display_name') THEN 
        RAISE EXCEPTION 'display_name column failed to create'; 
    END IF; 
END $$;
