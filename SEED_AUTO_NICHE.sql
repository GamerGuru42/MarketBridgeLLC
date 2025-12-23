-- Seed Data for Abuja Automotive Niche Launch
-- This creates a professional dealer and several car listings with full specs.

-- Temporarily disable the foreign key constraint for public.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Insert a premium Abuja dealer
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
    phone_number,
    created_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'abuja.motors@marketbridge.com',
    'Abuja Premium Motors',
    'dealer',
    'Maitama, Abuja',
    'Abuja Premium Motors Ltd',
    'physical',
    'enterprise',
    'active',
    true,
    '2348031234567',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Re-enable the foreign key constraint
-- ALTER TABLE public.users ADD CONSTRAINT users_id_fkey 
--    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Insert verified car listings for Abuja niche
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
  make,
  model,
  year,
  condition,
  transmission,
  mileage,
  fuel_type,
  body_type,
  is_verified_listing,
  verification_status,
  created_at
) VALUES 
(
  'a1b2c3d4-e5f6-4321-8765-111111111111',
  '2018 Toyota Camry XLE (Verified)',
  'Extremely clean 2018 Toyota Camry XLE. Features include panoramic roof, leather interior, lane departure warning, and adaptive cruise control. Fully serviced and ready for the road.',
  18500000,
  'Automotive',
  ARRAY['https://images.unsplash.com/photo-1598282361110-3487f879309a?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1549611016-3a70d82b5040?auto=format&fit=crop&w=800&q=80'],
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  'Maitama, Abuja',
  'Toyota',
  'Camry',
  2018,
  'Tokunbo',
  'Automatic',
  45000,
  'Petrol',
  'Sedan',
  true,
  'verified',
  NOW()
),
(
  'a2b2c3d4-e5f6-4321-8765-222222222222',
  '2020 Honda Accord Sport',
  'Freshly imported 2020 Honda Accord Sport. Turbocharged engine, 19-inch alloy wheels, Apple CarPlay, and Android Auto. Stunning Still Night Blue Pearl color.',
  15200000,
  'Automotive',
  ARRAY['https://images.unsplash.com/photo-1617469767053-d8229a9a6114?auto=format&fit=crop&w=800&q=80'],
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  'Wuse II, Abuja',
  'Honda',
  'Accord',
  2020,
  'Tokunbo',
  'Automatic',
  32000,
  'Petrol',
  'Sedan',
  true,
  'verified',
  NOW()
),
(
  'a3b2c3d4-e5f6-4321-8765-333333333333',
  '2015 Lexus RX 350',
  'Well maintained Nigerian used 2015 Lexus RX 350. Smooth transmission, chilling AC, and premium sound system. Perfect for Nigerian roads.',
  12400000,
  'Automotive',
  ARRAY['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80'],
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  'Garki, Abuja',
  'Lexus',
  'RX 350',
  2015,
  'Nigerian Used',
  'Automatic',
  98000,
  'Petrol',
  'SUV',
  false,
  'pending',
  NOW()
),
(
  'a4b2c3d4-e5f6-4321-8765-444444444444',
  '2017 Mercedes-Benz C300 4Matic',
  'Luxury and performance combined. 2017 Mercedes-Benz C300 with 4Matic AWD. Burmester sound, blind spot assist, and premium leather. Abuja cleared.',
  22500000,
  'Automotive',
  ARRAY['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80'],
  '550e8400-e29b-41d4-a716-446655440000',
  'active',
  'Asokoro, Abuja',
  'Mercedes-Benz',
  'C300',
  2017,
  'Tokunbo',
  'Automatic',
  56000,
  'Petrol',
  'Sedan',
  true,
  'verified',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
