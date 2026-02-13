-- Add Payment Proof columns to Orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT, -- Manual ref entered by user
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual_transfer'; -- 'manual_transfer', 'card', etc.

-- Update Order Status check to include 'pending_verification'
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'pending_verification', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed'));

-- Comment
COMMENT ON COLUMN public.orders.payment_proof_url IS 'URL to the uploaded payment receipt screenshot';
COMMENT ON COLUMN public.orders.payment_reference IS 'User-provided transaction reference for manual verification';

-- Ensure RLS is enabled and policies exist for Users
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
