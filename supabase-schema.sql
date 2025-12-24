-- MarketBridge Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'dealer', 'admin', 'ceo', 'cofounder', 'cto', 'coo', 'technical_admin', 'operations_admin', 'marketing_admin')),
    photo_url TEXT,
    location TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    store_type TEXT CHECK (store_type IN ('physical', 'online', 'both')),
    business_name TEXT,
    flutterwave_id TEXT,
    verification_documents TEXT[],
    wishlist TEXT[],
    subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
    subscription_status TEXT CHECK (subscription_status IN ('inactive', 'trial', 'active', 'cancelled')),
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    listing_limit INTEGER DEFAULT 5,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    images TEXT[] NOT NULL,
    videos TEXT[],
    status TEXT NOT NULL CHECK (status IN ('active', 'sold', 'inactive', 'pending')) DEFAULT 'pending',
    location TEXT,
    -- Car-specific fields
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
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'paid', 'escrowed')) DEFAULT 'pending',
    amount NUMERIC(10, 2) NOT NULL,
    shipping_address TEXT,
    phone_number TEXT,
    notes TEXT,
    transaction_ref TEXT,
    payment_provider TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] NOT NULL,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dealer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_dealer ON public.listings(dealer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_reviews_dealer ON public.reviews(dealer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view dealer profiles" ON public.users
    FOR SELECT USING (role = 'dealer');

-- RLS Policies for listings table
CREATE POLICY "Anyone can view active listings" ON public.listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Dealers can create listings" ON public.listings
    FOR INSERT WITH CHECK (auth.uid() = dealer_id);

CREATE POLICY "Dealers can update their own listings" ON public.listings
    FOR UPDATE USING (auth.uid() = dealer_id);

CREATE POLICY "Dealers can delete their own listings" ON public.listings
    FOR DELETE USING (auth.uid() = dealer_id);

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update order status" ON public.orders
    FOR UPDATE USING (auth.uid() = seller_id);

-- RLS Policies for chats table
CREATE POLICY "Users can view their own chats" ON public.chats
    FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create chats" ON public.chats
    FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in their chats" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chats.id = messages.chat_id
            AND auth.uid() = ANY(chats.participants)
        )
    );

CREATE POLICY "Users can send messages in their chats" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chats
            WHERE chats.id = chat_id
            AND auth.uid() = ANY(chats.participants)
        )
    );

-- RLS Policies for reviews table
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation (Trigger for Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'customer',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Enable RLS for wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist table
CREATE POLICY "Users can view their own wishlist" ON public.wishlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist" ON public.wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist" ON public.wishlist
    FOR DELETE USING (auth.uid() = user_id);
