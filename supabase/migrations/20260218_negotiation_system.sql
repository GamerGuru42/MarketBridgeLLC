-- Migration: Add Negotiation System
-- Add columns to existing listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS current_offered_price numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS original_price numeric;

-- Backfill original_price with current price for existing listings
UPDATE listings SET original_price = price WHERE original_price IS NULL;

-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) NOT NULL,
  seller_id uuid REFERENCES auth.users(id) NOT NULL,
  offered_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'completed')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Policies for offers
-- Buyers can view their own offers
CREATE POLICY "Buyers can view their own offers" ON offers
  FOR SELECT USING (auth.uid() = buyer_id);

-- Sellers can view offers on their listings
CREATE POLICY "Sellers can view offers on their listings" ON offers
  FOR SELECT USING (auth.uid() = seller_id);

-- Buyers can insert offers
CREATE POLICY "Buyers can insert offers" ON offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update offer status (accept/reject)
CREATE POLICY "Sellers can update offer status" ON offers
  FOR UPDATE USING (auth.uid() = seller_id);

-- Enable realtime on offers
ALTER PUBLICATION supabase_realtime ADD TABLE offers;
