-- Migration for Student Marketplace Pilot Phase (Abuja)
-- Date: 2026-02-09

-- 1. Expand User Schema for Student Verification
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS matric_number TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Expand Subscription Status for Verification Workflow
-- Drop existing constraint to allow update
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_subscription_status_check 
CHECK (subscription_status IN ('inactive', 'trial', 'active', 'cancelled', 'pending_payment', 'expired', 'pending_verification'));

-- 3. Relax Listing Condition for General Goods
-- The previous constraint was automobile-specific ('Tokunbo', 'Nigerian Used', 'Brand New')
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_condition_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_condition_check 
CHECK (condition IN ('Tokunbo', 'Nigerian Used', 'Brand New', 'UK Used', 'Used', 'Refurbished', 'Open Box', 'brand_new', 'used_clean'));

-- 4. Performance Optimization for Campus Scoping
CREATE INDEX IF NOT EXISTS idx_users_university ON public.users(university);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);

-- 5. Seed Initial FCT - Abuja Hub Metadata (Optional but helpful for Signal Engine)
-- This ensures the system recognizes the primary pilot sector
INSERT INTO public.waitlist (email, phone, category, created_at)
VALUES ('pilot@marketbridge.io', '0800-PILOT-HUB', 'ABUJA_PILOT_PHASE', NOW())
ON CONFLICT DO NOTHING;

-- 6. Add student role to the role check if not already there
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('customer', 'dealer', 'admin', 'ceo', 'cofounder', 'cto', 'coo', 'technical_admin', 'operations_admin', 'marketing_admin', 'student_buyer', 'student_seller'));
