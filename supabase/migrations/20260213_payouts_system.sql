-- Add Bank Details to Users (Sellers)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Add Payout Status to Orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
ADD COLUMN IF NOT EXISTS payout_reference TEXT,
ADD COLUMN IF NOT EXISTS payout_date TIMESTAMPTZ;

-- Ensure seller_receives exists just in case
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_receives DECIMAL(10, 2) DEFAULT 0;

-- Comments
COMMENT ON COLUMN public.users.bank_name IS 'Bank Name for Seller Payouts';
COMMENT ON COLUMN public.orders.payout_status IS 'Status of payout to seller';

-- Backfill fees for existing orders (Ensure trigger calculates it)
-- Note: This requires the 'trg_update_order_fees' from the revenue system script to work effectively.
-- If the trigger is missing, this update does nothing but refresh the timestamp.
BEGIN;
UPDATE public.orders SET amount = amount WHERE (seller_receives IS NULL OR seller_receives = 0) AND amount > 0;
COMMIT;
