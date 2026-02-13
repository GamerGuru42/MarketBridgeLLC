-- Add Refund Tracking to Platform Revenue
ALTER TABLE public.platform_revenue 
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none', -- 'none', 'requested', 'processed', 'declined'
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES auth.users(id);

-- Create a function to process refunds
CREATE OR REPLACE FUNCTION process_refund(
    p_transaction_id UUID, 
    p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Security Check: Ensure caller is an admin
    IF NOT check_is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only admins can process refunds';
    END IF;

    UPDATE public.platform_revenue
    SET 
        status = 'refunded',
        refund_status = 'processed',
        refund_reason = p_reason,
        refunded_at = NOW(),
        refunded_by = auth.uid()
    WHERE id = p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
