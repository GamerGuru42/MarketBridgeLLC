-- ============================================
-- COMPLETE SUPABASE RLS & SECURITY FIX
-- ============================================
-- Run this ONCE in Supabase SQL Editor to fix all issues.

-- ============================================
-- 1. FIX FUNCTION SEARCH_PATH (Security)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view dealer profiles" ON public.users;
DROP POLICY IF EXISTS "View profiles" ON public.users;

DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Dealers can create listings" ON public.listings;
DROP POLICY IF EXISTS "Dealers can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Dealers can delete their own listings" ON public.listings;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update order status" ON public.orders;

DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.messages;

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public.wishlist;

-- ============================================
-- 3. CREATE OPTIMIZED POLICIES
-- ============================================

-- USERS TABLE
CREATE POLICY "View profiles" ON public.users
    FOR SELECT USING (role = 'dealer' OR id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (
        id = (SELECT auth.uid()) OR 
        (SELECT auth.uid()) IS NULL
    );

-- LISTINGS TABLE
CREATE POLICY "Anyone can view active listings" ON public.listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Dealers can create listings" ON public.listings
    FOR INSERT WITH CHECK (dealer_id = (SELECT auth.uid()));

CREATE POLICY "Dealers can update their own listings" ON public.listings
    FOR UPDATE USING (dealer_id = (SELECT auth.uid()));

CREATE POLICY "Dealers can delete their own listings" ON public.listings
    FOR DELETE USING (dealer_id = (SELECT auth.uid()));

-- ORDERS TABLE
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid()));

CREATE POLICY "Buyers can create orders" ON public.orders
    FOR INSERT WITH CHECK (buyer_id = (SELECT auth.uid()));

CREATE POLICY "Sellers can update order status" ON public.orders
    FOR UPDATE USING (seller_id = (SELECT auth.uid()));

-- CHATS TABLE
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING ((SELECT auth.uid()) = ANY(participants));

CREATE POLICY "Users can create chats" ON public.chats
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = ANY(participants));

-- MESSAGES TABLE
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chats.id = messages.chat_id
            AND (SELECT auth.uid()) = ANY(chats.participants)
        )
    );

CREATE POLICY "Users can send messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        sender_id = (SELECT auth.uid()) AND
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chats.id = chat_id
            AND (SELECT auth.uid()) = ANY(chats.participants)
        )
    );

-- REVIEWS TABLE
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- WISHLIST TABLE
CREATE POLICY "Users can view their own wishlist" ON public.wishlist
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can add to their own wishlist" ON public.wishlist
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can remove from their own wishlist" ON public.wishlist
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- ============================================
-- DONE! All RLS policies optimized.
-- ============================================
