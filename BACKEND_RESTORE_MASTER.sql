-- ========================================================
-- MARKETBRIDGE MASTER BACKEND RESTORE SCRIPT
-- ========================================================
-- This script reconstructs the entire Supabase database schema,
-- including tables, RLS policies, functions, and triggers.
--
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard.
-- 2. Go to the "SQL Editor" tab.
-- 3. Click "New Query".
-- 4. Paste this ENTIRE script into the editor.
-- 5. Click "Run".
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CORE TABLES

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'dealer', 'admin', 'ceo', 'cofounder', 'cto', 'coo', 'technical_admin', 'operations_admin', 'marketing_admin')),
    phone_number TEXT,
    photo_url TEXT,
    location TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    store_type TEXT CHECK (store_type IN ('physical', 'online', 'both')),
    business_name TEXT,
    cac_number TEXT,
    flutterwave_id TEXT,
    verification_documents TEXT[],
    wishlist TEXT[],
    subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
    subscription_status TEXT CHECK (subscription_status IN ('inactive', 'trial', 'active', 'cancelled', 'pending_payment', 'expired')),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    subscription_expires_at TIMESTAMPTZ,
    trial_start_date TIMESTAMPTZ,
    listing_limit INTEGER DEFAULT 5,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    category TEXT NOT NULL,
    images TEXT[] NOT NULL,
    videos TEXT[],
    status TEXT NOT NULL CHECK (status IN ('active', 'sold', 'inactive', 'pending')) DEFAULT 'pending',
    location TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    condition TEXT CHECK (condition IN ('Tokunbo', 'Nigerian Used', 'Brand New')),
    transmission TEXT CHECK (transmission IN ('Automatic', 'Manual')),
    mileage INTEGER,
    fuel_type TEXT,
    engine_size TEXT,
    body_type TEXT,
    vin TEXT,
    is_verified_listing BOOLEAN DEFAULT FALSE,
    verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    inspection_report_url TEXT,
    inspector_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'paid', 'escrowed', 'refunded')) DEFAULT 'pending',
    amount NUMERIC(15, 2) NOT NULL,
    platform_fee NUMERIC(15, 2),
    net_amount NUMERIC(15, 2),
    shipping_address TEXT,
    phone_number TEXT,
    notes TEXT,
    transaction_ref TEXT,
    payment_provider TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats & Messages
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] NOT NULL,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist & Waitlist
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    phone TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escrow System
CREATE TABLE IF NOT EXISTS public.escrow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    steps JSONB NOT NULL,
    tos_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

CREATE TABLE IF NOT EXISTS public.escrow_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.users(id),
    seller_id UUID NOT NULL REFERENCES public.users(id),
    amount DECIMAL(15, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'cancelled')) DEFAULT 'pending',
    current_step_index INTEGER DEFAULT 0,
    agreement_type TEXT NOT NULL CHECK (agreement_type IN ('default', 'custom')),
    tos_accepted_buyer BOOLEAN DEFAULT FALSE,
    tos_accepted_seller BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.escrow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agreement_id UUID NOT NULL REFERENCES public.escrow_agreements(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    buyer_confirmed_at TIMESTAMPTZ,
    seller_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_dealer ON public.listings(dealer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(chat_id);

-- 5. FUNCTIONS & TRIGGERS

-- Trigger for auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_role TEXT;
BEGIN
  initial_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  INSERT INTO public.users (
    id, 
    email, 
    display_name, 
    role, 
    photo_url,
    location,
    phone_number
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    initial_role,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escrow_agreements_updated_at BEFORE UPDATE ON public.escrow_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_steps ENABLE ROW LEVEL SECURITY;

-- RBAC Helper
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

-- 7. RLS POLICIES

-- Profiles
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Executives view all profiles" ON public.users FOR SELECT USING (public.is_executive() OR auth.uid() = id OR role = 'dealer');
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Listings
CREATE POLICY "Public view active listings" ON public.listings FOR SELECT USING (status = 'active' OR public.is_executive() OR auth.uid() = dealer_id);
CREATE POLICY "Dealers manage own listings" ON public.listings FOR ALL USING (auth.uid() = dealer_id);
CREATE POLICY "Executives moderate listings" ON public.listings FOR UPDATE USING (public.is_executive());

-- Orders
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.is_executive());
CREATE POLICY "Buyers create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Chats
CREATE POLICY "Participants view own chats" ON public.chats FOR SELECT USING (auth.uid() = ANY(participants) OR public.is_executive());
CREATE POLICY "Participants view own messages" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND auth.uid() = ANY(chats.participants)));

-- Escrow
CREATE POLICY "View templates" ON public.escrow_templates FOR SELECT USING (true);
CREATE POLICY "Manage agreements" ON public.escrow_agreements FOR ALL USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_executive());

-- Waitlist
CREATE POLICY "Join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin view waitlist" ON public.waitlist FOR SELECT USING (public.is_executive());

-- ========================================================
-- DONE! RUN THE ABOVE IN SUPABASE SQL EDITOR.
-- ========================================================
