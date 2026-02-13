-- Create Search Analytics Table
CREATE TABLE IF NOT EXISTS public.search_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    selected_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Platform Revenue Table
CREATE TABLE IF NOT EXISTS public.platform_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('order_fee', 'subscription', 'dealer_registration', 'dispute_penalty', 'other')),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL, -- Platform's revenue amount
    percentage_fee DECIMAL(5, 2), -- Fee percentage (e.g., 5.00 for 5%)
    seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    payment_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'refunded', 'disputed')),
    collected_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add platform_fee column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_receives DECIMAL(10, 2) DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user ON public.search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_searched_at ON public.search_analytics(searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_revenue_type ON public.platform_revenue(transaction_type);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_status ON public.platform_revenue(status);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_created_at ON public.platform_revenue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_seller ON public.platform_revenue(seller_id);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Search Analytics

-- Admins can view all search analytics
CREATE POLICY "Admins can view all search analytics" ON public.search_analytics
    FOR SELECT
    USING (check_is_admin());

-- Users can view their own search history
CREATE POLICY "Users can view own search history" ON public.search_analytics
    FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone can insert search analytics (anonymous tracking)
CREATE POLICY "Anyone can insert search analytics" ON public.search_analytics
    FOR INSERT
    WITH CHECK (true);

-- RLS Policies for Platform Revenue

-- Only admins can view platform revenue
CREATE POLICY "Admins can view all revenue" ON public.platform_revenue
    FOR SELECT
    USING (check_is_admin());

-- Only admins can insert revenue records
CREATE POLICY "Admins can insert revenue" ON public.platform_revenue
    FOR INSERT
    WITH CHECK (check_is_admin());

-- Only admins can update revenue
CREATE POLICY "Admins can update revenue" ON public.platform_revenue
    FOR UPDATE
    USING (check_is_admin());

-- Create function to auto-calculate platform fees
CREATE OR REPLACE FUNCTION calculate_platform_fee(order_amount DECIMAL)
RETURNS TABLE(platform_fee DECIMAL, seller_receives DECIMAL) AS $$
DECLARE
    fee_percentage DECIMAL := 5.0; -- 5% platform fee
    min_fee DECIMAL := 100; -- ₦100 minimum
    max_fee DECIMAL := 50000; -- ₦50,000 maximum
    calculated_fee DECIMAL;
BEGIN
    -- Calculate percentage-based fee
    calculated_fee := (order_amount * fee_percentage) / 100;
    
    -- Apply minimum
    IF calculated_fee < min_fee THEN
        calculated_fee := min_fee;
    END IF;
    
    -- Apply maximum cap
    IF calculated_fee > max_fee THEN
        calculated_fee := max_fee;
    END IF;
    
    -- Return results
    RETURN QUERY SELECT 
        ROUND(calculated_fee, 2)::DECIMAL AS platform_fee,
        ROUND(order_amount - calculated_fee, 2)::DECIMAL AS seller_receives;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate platform_fee and seller_receives when order is created/updated
CREATE OR REPLACE FUNCTION update_order_fees()
RETURNS TRIGGER AS $$
DECLARE
    fees RECORD;
BEGIN
    -- Calculate fees
    SELECT * INTO fees FROM calculate_platform_fee(NEW.amount);
    
    -- Set the fields
    NEW.platform_fee := fees.platform_fee;
    NEW.seller_receives := fees.seller_receives;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_order_fees ON public.orders;
CREATE TRIGGER trg_update_order_fees
    BEFORE INSERT OR UPDATE OF amount ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_fees();

-- Add comment for documentation
COMMENT ON TABLE public.platform_revenue IS 'Tracks all revenue collected by MarketBridge platform from fees, subscriptions, and other sources';
COMMENT ON TABLE public.search_analytics IS 'Tracks user search behavior for improving search algorithms and recommendations';
COMMENT ON FUNCTION calculate_platform_fee IS 'Calculates platform fee (5%) with min ₦100 and max ₦50,000 cap';
