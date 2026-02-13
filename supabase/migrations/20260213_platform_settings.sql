-- Create Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;
    DROP POLICY IF EXISTS "Public can view settings" ON public.platform_settings;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Admins can manage settings" ON public.platform_settings
    FOR ALL
    USING (check_is_admin());

CREATE POLICY "Public can view settings" ON public.platform_settings
    FOR SELECT
    USING (true);

-- Insert Default Bank Details (Moniepoint MFB)
INSERT INTO public.platform_settings (key, value)
VALUES ('bank_details', '{"account_number": "9022858358", "bank_name": "Moniepoint MFB", "account_name": "MarketBridge Escrow"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
