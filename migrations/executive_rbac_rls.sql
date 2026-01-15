-- =============================================
-- EXECUTIVE ROLE-BASED ACCESS CONTROL (RBAC)
-- =============================================
-- This migration grants full read access to administrative roles 
-- for critical business tables.

-- 1. Helper Function to check if user is an Executive/Admin
CREATE OR REPLACE FUNCTION public.is_executive()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('admin', 'ceo', 'cofounder', 'cto', 'coo', 'technical_admin', 'operations_admin', 'marketing_admin')
        FROM public.users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. USERS TABLE POLICIES
DROP POLICY IF EXISTS "Executives can view all profiles" ON public.users;
CREATE POLICY "Executives can view all profiles" ON public.users
    FOR SELECT USING (public.is_executive() OR auth.uid() = id OR role = 'dealer');

-- 3. LISTINGS TABLE POLICIES
DROP POLICY IF EXISTS "Executives can view all listings" ON public.listings;
CREATE POLICY "Executives can view all listings" ON public.listings
    FOR SELECT USING (public.is_executive() OR status = 'active');

DROP POLICY IF EXISTS "Executives can moderate listings" ON public.listings;
CREATE POLICY "Executives can moderate listings" ON public.listings
    FOR UPDATE USING (public.is_executive());

-- 4. ORDERS TABLE POLICIES
DROP POLICY IF EXISTS "Executives can view all orders" ON public.orders;
CREATE POLICY "Executives can view all orders" ON public.orders
    FOR SELECT USING (public.is_executive() OR auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 5. CHATS & MESSAGES (Optional: Usually kept private unless for disputes)
-- For now, we keep these private unless there's an explicit need for admin 'snooping'
-- which is usually handled through a separate Audit log or Dispute view.

-- =============================================
-- DONE! RUN IN SUPABASE SQL EDITOR.
-- =============================================
