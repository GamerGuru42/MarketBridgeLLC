-- 1. Add Manual Payment Columns
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual_transfer';

-- 2. Update Status Constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'pending_verification', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'disputed'));

-- 3. Create Storage Bucket for Receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true) ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS on Storage
DO $$ BEGIN
    DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Authenticated users can upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Public can view receipts" ON storage.objects FOR SELECT TO public USING (bucket_id = 'receipts');

-- 5. Fix Policies for Orders (USING CORRECT buyer_id)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
