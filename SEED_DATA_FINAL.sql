-- Seed Data for NEW Supabase Project
-- This creates a user in auth.users first, which triggers the handle_new_user function

-- Step 1: Create a user in auth.users
-- Note: We need to create the auth user with a hashed password
-- The handle_new_user trigger will automatically create the public.users record

-- Insert into auth.users (this requires admin access)
-- Since we can't directly insert into auth.users via SQL Editor with proper password hashing,
-- we'll use a workaround: Create the public.users record manually after disabling the FK constraint temporarily

-- Temporarily disable the foreign key constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Insert test user into public.users
INSERT INTO public.users (
    id,
    email,
    display_name,
    role,
    location,
    business_name,
    store_type,
    subscription_plan,
    subscription_status,
    is_verified,
    created_at
) VALUES (
    'ec68eb49-d346-4f4f-8e83-53438bbdf55b',
    'testdealer@example.com',
    'Test Dealer',
    'dealer',
    'Lagos, Nigeria',
    'Lagos Auto Hub',
    'physical',
    'professional',
    'active',
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Re-enable the foreign key constraint
ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create Listings
INSERT INTO public.listings (
  id, 
  title, 
  description, 
  price, 
  category, 
  images, 
  dealer_id, 
  status, 
  location,
  created_at
) VALUES 
(
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
  '2020 Toyota Camry XSE',
  'Clean foreign used Toyota Camry XSE. Full option with panoramic roof, leather seats, and low mileage. No faults.',
  15000000,
  'Automotive',
  ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=800&q=80'],
  'ec68eb49-d346-4f4f-8e83-53438bbdf55b',
  'active',
  'Ikeja, Lagos',
  NOW()
),
(
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
  'iPhone 13 Pro Max - 256GB',
  'UK Used iPhone 13 Pro Max. 256GB storage, Sierra Blue. Battery health 90%. Comes with charger.',
  950000,
  'Electronics',
  ARRAY['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80'],
  'ec68eb49-d346-4f4f-8e83-53438bbdf55b',
  'active',
  'Lekki, Lagos',
  NOW()
),
(
  'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
  'MacBook Pro M1 2020',
  'Neat UK used MacBook Pro M1. 8GB RAM, 256GB SSD. Space Gray. Perfect working condition.',
  850000,
  'Electronics',
  ARRAY['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80'],
  'ec68eb49-d346-4f4f-8e83-53438bbdf55b',
  'active',
  'Yaba, Lagos',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create Reviews
INSERT INTO public.reviews (
  id,
  listing_id,
  reviewer_id,
  dealer_id,
  rating,
  comment,
  created_at
) VALUES
(
  'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380e55',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
  'ec68eb49-d346-4f4f-8e83-53438bbdf55b',
  'ec68eb49-d346-4f4f-8e83-53438bbdf55b',
  5,
  'Great car, exactly as described!',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
