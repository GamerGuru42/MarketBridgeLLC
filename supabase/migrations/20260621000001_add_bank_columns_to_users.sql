-- Migration: Add bank details columns back to users table
-- Description: Restores bank_name, bank_code, account_number, and account_name columns to public.users table to maintain compatibility with the frontend application.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_name TEXT;

COMMENT ON COLUMN public.users.bank_name IS 'Bank Name for Seller Payouts';
COMMENT ON COLUMN public.users.bank_code IS 'Bank Code (Paystack) for Seller Payouts';
COMMENT ON COLUMN public.users.account_number IS 'Bank Account Number for Seller Payouts';
COMMENT ON COLUMN public.users.account_name IS 'Bank Account Name for Seller Payouts';
