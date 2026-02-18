-- Add email verification columns for sellers
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_otp_sent TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;

-- Comment to track that these are for the Email OTP feature
COMMENT ON COLUMN public.users.email_verified IS 'Tracks if the seller has verified their email via OTP';
COMMENT ON COLUMN public.users.last_otp_sent IS 'Timestamp of the last OTP sent to the user';
COMMENT ON COLUMN public.users.otp_attempts IS 'Number of OTP verification attempts to prevent brute force';
