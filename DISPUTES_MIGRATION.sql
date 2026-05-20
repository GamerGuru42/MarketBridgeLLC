-- =========================================================================
-- Phase 2: Role Consolidation and Dispute Resolution Database Migration
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- Step 1: Populate Profiles Table and Migrate Roles
-- -------------------------------------------------------------------------

-- Create the profiles table if for some reason it's missing (though it exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'buyer',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy all existing role information from users into profiles
INSERT INTO public.profiles (id, email, role, created_at)
SELECT id, email, role, COALESCE(created_at, NOW())
FROM public.users
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, email = EXCLUDED.email;

-- -------------------------------------------------------------------------
-- Step 2: Redefine Security Functions
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_role text;
BEGIN
    SELECT role INTO current_role FROM public.profiles WHERE id = auth.uid();
    RETURN current_role IN ('admin', 'ops_admin', 'tech_admin', 'marketing_admin', 'ceo');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_executive()
RETURNS BOOLEAN AS $$
DECLARE
    current_role text;
BEGIN
    SELECT role INTO current_role FROM public.profiles WHERE id = auth.uid();
    RETURN current_role IN ('admin', 'ceo', 'ops_admin', 'tech_admin', 'marketing_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions explicitly
GRANT EXECUTE ON FUNCTION public.check_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin TO service_role;
GRANT EXECUTE ON FUNCTION public.is_executive TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_executive TO service_role;

-- -------------------------------------------------------------------------
-- Step 3: Redefine Trigger handle_new_user()
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile attributes (except role which goes to profiles)
  INSERT INTO public.users (
    id, 
    email, 
    display_name, 
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
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert role into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  )
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role, email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- Step 4: Drop/Recreate Dependent Policies on public.users
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read dealer profiles" ON public.users;
CREATE POLICY "Public can read dealer profiles" ON public.users 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = users.id 
    AND profiles.role = 'seller'
  )
);

DROP POLICY IF EXISTS "Executives can view all profiles" ON public.users;
CREATE POLICY "Executives can view all profiles" ON public.users
FOR SELECT USING (public.is_executive() OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.users;
CREATE POLICY "Admins can read all profiles" ON public.users 
FOR SELECT USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
CREATE POLICY "Admins can update all profiles" ON public.users 
FOR UPDATE USING (public.check_is_admin());

-- -------------------------------------------------------------------------
-- Step 5: Drop Role Column from Users Table
-- -------------------------------------------------------------------------

ALTER TABLE public.users DROP COLUMN IF EXISTS role CASCADE;

-- -------------------------------------------------------------------------
-- Step 6: Create/Re-Create Notifications Table
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notifications" ON public.notifications;
CREATE POLICY "Users can read their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- Step 7: Create/Re-Create Disputes Table with Correct Enums
-- -------------------------------------------------------------------------

DROP TABLE IF EXISTS public.disputes CASCADE;

CREATE TABLE public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filed_by_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}'::TEXT[],
    seller_evidence_urls TEXT[] DEFAULT '{}'::TEXT[],
    seller_response TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'seller_responded', 'under_review', 'resolved', 'escalated', 'closed')),
    resolution TEXT,
    resolution_notes TEXT,
    refund_amount NUMERIC(10, 2) DEFAULT 0.00,
    admin_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    appeal_reason TEXT,
    appealed_by UUID REFERENCES public.users(id),
    appealed_at TIMESTAMPTZ
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- Step 8: RLS Policies for Disputes
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view disputes they are party to" ON public.disputes;
CREATE POLICY "Users can view disputes they are party to" ON public.disputes
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        public.check_is_admin()
    );

DROP POLICY IF EXISTS "Users can insert disputes they file" ON public.disputes;
CREATE POLICY "Users can insert disputes they file" ON public.disputes
    FOR INSERT WITH CHECK (
        (auth.uid() = buyer_id OR auth.uid() = seller_id) AND
        auth.uid() = filed_by_id
    );

DROP POLICY IF EXISTS "Users can update disputes they are party to" ON public.disputes;
CREATE POLICY "Users can update disputes they are party to" ON public.disputes
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() = seller_id OR
        public.check_is_admin()
    );

-- -------------------------------------------------------------------------
-- Step 9: Triggers on Disputes
-- -------------------------------------------------------------------------

-- Auto updated_at trigger
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dispute Notifications Trigger Function
CREATE OR REPLACE FUNCTION notify_dispute_update()
RETURNS TRIGGER AS $$
BEGIN
    -- On INSERT (new dispute filed)
    IF (TG_OP = 'INSERT') THEN
      -- Notify buyer
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.buyer_id,
        'dispute_update',
        'Dispute Filed',
        'A dispute has been opened for order #' || NEW.order_id || '. Current status: ' || NEW.status,
        '/orders/' || NEW.order_id
      );
      
      -- Notify seller
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.seller_id,
        'dispute_update',
        'Dispute Opened',
        'A dispute has been opened against your order #' || NEW.order_id || '. Current status: ' || NEW.status,
        '/seller/orders/' || NEW.order_id
      );
    -- On UPDATE (dispute updated or resolved)
    ELSIF (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.resolution IS DISTINCT FROM NEW.resolution)) THEN
      -- Notify buyer
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.buyer_id,
        'dispute_update',
        'Dispute Update',
        'Your dispute for order #' || NEW.order_id || ' has been updated to: ' || NEW.status || COALESCE('. Resolution: ' || NEW.resolution, ''),
        '/orders/' || NEW.order_id
      );
      
      -- Notify seller
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.seller_id,
        'dispute_update',
        'Dispute Update',
        'The dispute for order #' || NEW.order_id || ' has been updated to: ' || NEW.status || COALESCE('. Resolution: ' || NEW.resolution, ''),
        '/seller/orders/' || NEW.order_id
      );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS dispute_notification ON public.disputes;
CREATE TRIGGER dispute_notification
AFTER INSERT OR UPDATE ON public.disputes
FOR EACH ROW EXECUTE FUNCTION notify_dispute_update();

-- -------------------------------------------------------------------------
-- Step 10: Storage Buckets & Policies
-- -------------------------------------------------------------------------

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-evidence', 'dispute-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Insert Policy (Enforces <=5MB, mimetype image, and user as dispute buyer or seller)
DROP POLICY IF EXISTS "Dispute evidence upload" ON storage.objects;
CREATE POLICY "Dispute evidence upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'dispute-evidence'
  AND (metadata->>'size')::int < 5242880  -- 5MB
  AND (metadata->>'mimetype') IN ('image/jpeg', 'image/png', 'image/webp')
  AND auth.uid() IN (
    SELECT buyer_id FROM public.disputes WHERE id = (storage.foldername(name))[1]::uuid
    UNION
    SELECT seller_id FROM public.disputes WHERE id = (storage.foldername(name))[1]::uuid
  )
);

-- Storage Select Policy
DROP POLICY IF EXISTS "Dispute evidence read" ON storage.objects;
CREATE POLICY "Dispute evidence read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'dispute-evidence'
  AND (
    public.check_is_admin() OR
    auth.uid() IN (
      SELECT buyer_id FROM public.disputes WHERE id = (storage.foldername(name))[1]::uuid
      UNION
      SELECT seller_id FROM public.disputes WHERE id = (storage.foldername(name))[1]::uuid
    )
  )
);

-- Storage Delete Policy
DROP POLICY IF EXISTS "Dispute evidence delete" ON storage.objects;
CREATE POLICY "Dispute evidence delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'dispute-evidence'
  AND auth.uid() IN (
    SELECT buyer_id FROM public.disputes WHERE id = (storage.foldername(name))[1]::uuid
    UNION
    SELECT seller_id FROM public.disputes WHERE id = (storage.foldername(name))[1]::uuid
  )
);

COMMIT;
