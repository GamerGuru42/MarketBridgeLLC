-- Complete Seller Verification Logic - Magic Links, OTP & 48hr Fast-Track Access
-- Add missing columns to support the new authentication modes
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS matriculation_number text,
ADD COLUMN IF NOT EXISTS is_temporary_seller boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS temporary_seller_expires_at timestamp with time zone;

-- Ensure role permissions on the new columns check out natively
COMMENT ON COLUMN public.users.is_temporary_seller IS 'Fast-tracked seller state for 48 hours bypass';
COMMENT ON COLUMN public.users.temporary_seller_expires_at IS 'When the 48 hour temporary seller state lapses without admin verification';

-- Refresh postgrest schema
NOTIFY pgrst, 'reload schema';
