-- Migration to add Bank Account Details for Sellers

-- Add bank details to Users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_code text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS account_name text;

-- Notify Supabase to pick up schema changes
NOTIFY pgrst, 'reload schema';
