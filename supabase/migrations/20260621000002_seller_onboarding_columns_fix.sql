-- Migration: Add all missing columns for seller onboarding and update role constraint
-- Fixes: account_name, account_number, bank_name, bank_code, phone_number schema cache errors
-- Fixes: "new row for relation 'users' violates check constraint 'users_role_check'" by updating the constraint to permit student_buyer, student_seller, and administrative roles.

-- 1. Drop existing check constraint on roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add constraint back allowing all system roles (buyer, seller, student_buyer, student_seller, admin roles)
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN (
    'buyer', 'seller', 'admin', 
    'student_buyer', 'student_seller', 
    'customer', 'dealer', 'super_admin', 'ceo', 'cofounder',
    'technical_admin', 'operations_admin', 'marketing_admin', 'systems_admin', 'it_support'
));

-- 3. Add missing columns for onboarding if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payout_setup BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_temporary_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS temporary_seller_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;