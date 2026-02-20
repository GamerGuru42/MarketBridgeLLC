-- ============================================================
-- MarketBridge – site_settings & sponsored_listings migration
-- Run this in your Supabase SQL editor (once)
-- ============================================================

-- 1) site_settings table – stores platform-wide feature flags
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT 'false',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Seed the public section flag (disabled by default)
INSERT INTO site_settings (key, value)
VALUES ('public_section_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- RLS: Only service role can write, anyone can read
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "site_settings_read"
ON site_settings FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "site_settings_write"
ON site_settings FOR ALL
USING (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()
    AND role IN ('ceo', 'technical_admin')
));

-- 2) sponsored_listings table
CREATE TABLE IF NOT EXISTS sponsored_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_ngn INTEGER NOT NULL CHECK (amount_ngn >= 500),
    duration_hours INTEGER NOT NULL CHECK (duration_hours IN (24, 48, 72)),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ GENERATED ALWAYS AS (starts_at + (duration_hours || ' hours')::INTERVAL) STORED,
    is_active BOOLEAN DEFAULT true,
    paystack_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sponsored_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "sponsored_listings_seller_insert"
ON sponsored_listings FOR INSERT
WITH CHECK (seller_id = auth.uid());

CREATE POLICY IF NOT EXISTS "sponsored_listings_view"
ON sponsored_listings FOR SELECT USING (true);

-- 3) coins_transactions table (if not exists)
CREATE TABLE IF NOT EXISTS coins_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coins_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "coins_transactions_user"
ON coins_transactions FOR SELECT
USING (user_id = auth.uid());

-- 4) Supabase RPC functions for coins (if not exist)
-- add_coins: atomically add coins and log transaction
CREATE OR REPLACE FUNCTION add_coins(
    user_id UUID,
    amount_to_add INTEGER,
    trans_type TEXT,
    trans_desc TEXT
) RETURNS void AS $$
BEGIN
    UPDATE users SET coins_balance = COALESCE(coins_balance, 0) + amount_to_add
    WHERE id = user_id;

    INSERT INTO coins_transactions(user_id, type, amount, description)
    VALUES (user_id, trans_type, amount_to_add, trans_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- subtract_coins: atomically subtract coins (with balance check)
CREATE OR REPLACE FUNCTION subtract_coins(
    user_id UUID,
    amount_to_subtract INTEGER,
    trans_type TEXT,
    trans_desc TEXT
) RETURNS void AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    SELECT COALESCE(coins_balance, 0) INTO current_balance FROM users WHERE id = user_id;
    IF current_balance < amount_to_subtract THEN
        RAISE EXCEPTION 'Insufficient coin balance';
    END IF;

    UPDATE users SET coins_balance = coins_balance - amount_to_subtract
    WHERE id = user_id;

    INSERT INTO coins_transactions(user_id, type, amount, description)
    VALUES (user_id, trans_type, -amount_to_subtract, trans_desc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) system_audit_logs (if not exists)
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "audit_logs_admin_read"
ON system_audit_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()
    AND role IN ('ceo', 'technical_admin', 'operations_admin')
));

CREATE POLICY IF NOT EXISTS "audit_logs_insert"
ON system_audit_logs FOR INSERT
WITH CHECK (actor_id = auth.uid());

-- Done!
SELECT 'Migration complete – site_settings, sponsored_listings, coins_transactions, system_audit_logs ready.' AS status;
