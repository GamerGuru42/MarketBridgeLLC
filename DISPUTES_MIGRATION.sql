-- ============================================
-- DISPUTE RESOLUTION SYSTEM
-- ============================================

-- 1. Create Disputes Table
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    filed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'under_review', 'resolved', 'rejected')) DEFAULT 'open',
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Users can view their own disputes
CREATE POLICY "Users can view their own disputes" ON public.disputes
    FOR SELECT USING (
        filed_by = (SELECT auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = disputes.order_id 
            AND (orders.buyer_id = (SELECT auth.uid()) OR orders.seller_id = (SELECT auth.uid()))
        )
    );

-- Users can create disputes for their orders
CREATE POLICY "Users can create disputes" ON public.disputes
    FOR INSERT WITH CHECK (
        filed_by = (SELECT auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_id 
            AND (orders.buyer_id = (SELECT auth.uid()) OR orders.seller_id = (SELECT auth.uid()))
        )
    );

-- Admins (Operations) can view all disputes
CREATE POLICY "Admins can view all disputes" ON public.disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = (SELECT auth.uid()) 
            AND users.role IN ('operations_admin', 'admin', 'ceo', 'cofounder')
        )
    );

-- Admins can update disputes
CREATE POLICY "Admins can update disputes" ON public.disputes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = (SELECT auth.uid()) 
            AND users.role IN ('operations_admin', 'admin', 'ceo', 'cofounder')
        )
    );

-- 4. Trigger for updated_at
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
