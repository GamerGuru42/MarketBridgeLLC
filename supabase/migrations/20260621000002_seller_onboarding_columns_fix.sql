-- Migration: Add all missing columns for seller onboarding
-- Fixes: account_name, account_number, bank_name, bank_code, phone_number schema cache errors

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