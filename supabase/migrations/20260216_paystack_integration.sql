-- MarketBridge Paystack Integration Migration
-- Date: 2026-02-16

-- 1. Update Users table for Paystack Subaccounts
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT,
ADD COLUMN IF NOT EXISTS bank_details JSONB; -- {bank_name, bank_code, account_number, account_name}

-- 2. Create Sales Transactions table
CREATE TABLE IF NOT EXISTS public.sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paystack_reference TEXT UNIQUE NOT NULL,
    listing_id UUID REFERENCES public.listings(id),
    buyer_id UUID REFERENCES public.users(id),
    seller_id UUID REFERENCES public.users(id),
    amount_total NUMERIC NOT NULL, -- in NGN
    amount_seller NUMERIC NOT NULL, -- in NGN
    amount_platform NUMERIC NOT NULL, -- in NGN
    commission_rate NUMERIC DEFAULT 7, -- percentage
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_sales_transactions_paystack_ref ON public.sales_transactions(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_seller ON public.sales_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_buyer ON public.sales_transactions(buyer_id);

-- 3. RLS for Sales Transactions
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;

-- Allow buyers to see their own purchases
CREATE POLICY "Users can view their own purchases" ON public.sales_transactions
FOR SELECT USING (auth.uid() = buyer_id);

-- Allow sellers to see their sales
CREATE POLICY "Sellers can view their own sales" ON public.sales_transactions
FOR SELECT USING (auth.uid() = seller_id);

-- Allow admins to see everything
CREATE POLICY "Admins can view all transactions" ON public.sales_transactions
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'ceo', 'operations_admin', 'technical_admin'))
);

-- 4. Settings for Commission
INSERT INTO public.platform_settings (key, value)
VALUES ('sales_commission', '{"percentage": 7, "bearer": "platform"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
