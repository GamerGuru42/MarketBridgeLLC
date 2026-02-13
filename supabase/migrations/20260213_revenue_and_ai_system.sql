-- 1. CLEANUP: Drop old functions to avoid conflicts
DROP TRIGGER IF EXISTS trg_update_order_fees ON public.orders;
DROP FUNCTION IF EXISTS update_order_fees();
DROP FUNCTION IF EXISTS calculate_platform_fee(decimal);
DROP FUNCTION IF EXISTS calculate_platform_fee(numeric);

-- 2. RE-CREATE: Search Analytics Table
CREATE TABLE IF NOT EXISTS public.search_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    selected_listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RE-CREATE: Platform Revenue Table
CREATE TABLE IF NOT EXISTS public.platform_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('order_fee', 'subscription', 'dealer_registration', 'dispute_penalty', 'other')),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    percentage_fee DECIMAL(5, 2),
    seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    payment_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'refunded', 'disputed')),
    collected_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add columns securely
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_receives DECIMAL(10, 2) DEFAULT 0;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON public.search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_created_at ON public.platform_revenue(created_at DESC);

-- 6. Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- 7. Policies (Safe to run multiple times)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view all search analytics" ON public.search_analytics;
    DROP POLICY IF EXISTS "Users can view own search history" ON public.search_analytics;
    DROP POLICY IF EXISTS "Anyone can insert search analytics" ON public.search_analytics;
    DROP POLICY IF EXISTS "Admins can view all revenue" ON public.platform_revenue;
    DROP POLICY IF EXISTS "Admins can insert revenue" ON public.platform_revenue;
    DROP POLICY IF EXISTS "Admins can update revenue" ON public.platform_revenue;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admins can view all search analytics" ON public.search_analytics FOR SELECT USING (check_is_admin());
CREATE POLICY "Users can view own search history" ON public.search_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert search analytics" ON public.search_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all revenue" ON public.platform_revenue FOR SELECT USING (check_is_admin());
CREATE POLICY "Admins can insert revenue" ON public.platform_revenue FOR INSERT WITH CHECK (check_is_admin());
CREATE POLICY "Admins can update revenue" ON public.platform_revenue FOR UPDATE USING (check_is_admin());

-- 8. Functions (New Logic)
CREATE OR REPLACE FUNCTION calculate_platform_fee(
    order_amount DECIMAL, 
    OUT platform_fee DECIMAL, 
    OUT seller_receives DECIMAL
)
RETURNS RECORD AS $$
BEGIN
    platform_fee := ROUND(GREATEST(LEAST((order_amount * 5.0 / 100), 50000), 100), 2);
    seller_receives := ROUND(order_amount - platform_fee, 2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_order_fees() RETURNS TRIGGER AS $$
DECLARE fees RECORD;
BEGIN
    SELECT * INTO fees FROM calculate_platform_fee(NEW.amount);
    NEW.platform_fee := fees.platform_fee;
    NEW.seller_receives := fees.seller_receives;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_fees BEFORE INSERT OR UPDATE OF amount ON public.orders FOR EACH ROW EXECUTE FUNCTION update_order_fees();
