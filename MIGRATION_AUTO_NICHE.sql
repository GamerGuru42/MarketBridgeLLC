-- Migration to add car-specific fields to listings table
-- Date: 2025-12-23

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS make TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS condition TEXT CHECK (condition IN ('Tokunbo', 'Nigerian Used', 'Brand New')),
ADD COLUMN IF NOT EXISTS transmission TEXT CHECK (transmission IN ('Automatic', 'Manual')),
ADD COLUMN IF NOT EXISTS mileage INTEGER,
ADD COLUMN IF NOT EXISTS fuel_type TEXT,
ADD COLUMN IF NOT EXISTS engine_size TEXT,
ADD COLUMN IF NOT EXISTS body_type TEXT,
ADD COLUMN IF NOT EXISTS vin TEXT,
ADD COLUMN IF NOT EXISTS is_verified_listing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS inspection_report_url TEXT,
ADD COLUMN IF NOT EXISTS inspector_notes TEXT;

-- Update the status check constraint to include 'pending'
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check CHECK (status IN ('active', 'sold', 'inactive', 'pending'));

-- Update default status to pending for new listings
ALTER TABLE public.listings ALTER COLUMN status SET DEFAULT 'pending';

-- Add a table for the waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    phone TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for waitlist
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist
CREATE POLICY "Anyone can join the waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- Only admins can view the waitlist
CREATE POLICY "Admins can view the waitlist" ON public.waitlist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'ceo', 'cofounder')
        )
    );
