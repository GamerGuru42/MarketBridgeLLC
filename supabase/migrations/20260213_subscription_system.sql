-- MarketBridge Subscription & Payment System
-- Database Migration Script
-- Date: 2026-02-13
-- Version: 1.0.0

-- ============================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'campus_starter', 'campus_pro', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused', 'pending')),
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    trial_end TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one active subscription per user
    CONSTRAINT unique_active_subscription UNIQUE (user_id, status) WHERE status = 'active'
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- ============================================
-- 2. PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD', 'GBP', 'EUR')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'successful', 'failed', 'refunded', 'cancelled')),
    processor TEXT NOT NULL CHECK (processor IN ('paystack', 'flutterwave', 'stripe', 'manual')),
    processor_reference TEXT UNIQUE NOT NULL,
    processor_response JSONB DEFAULT '{}',
    payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer', 'ussd', 'mobile_money', 'manual')),
    card_last4 TEXT,
    card_brand TEXT,
    card_exp_month INTEGER CHECK (card_exp_month BETWEEN 1 AND 12),
    card_exp_year INTEGER CHECK (card_exp_year >= 2024),
    failure_reason TEXT,
    refunded_at TIMESTAMP,
    refund_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_processor_reference ON payments(processor_reference);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- ============================================
-- 3. INVOICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    tax_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
    currency TEXT DEFAULT 'NGN',
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    pdf_url TEXT,
    line_items JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ============================================
-- 4. PAYMENT METHODS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    processor TEXT NOT NULL CHECK (processor IN ('paystack', 'flutterwave', 'stripe')),
    processor_token TEXT NOT NULL, -- Tokenized reference from processor
    processor_customer_id TEXT, -- Customer ID in processor's system
    type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
    card_last4 TEXT,
    card_brand TEXT,
    card_exp_month INTEGER CHECK (card_exp_month BETWEEN 1 AND 12),
    card_exp_year INTEGER CHECK (card_exp_year >= 2024),
    bank_name TEXT,
    account_last4 TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure only one default payment method per user
    CONSTRAINT unique_default_payment_method UNIQUE (user_id, is_default) WHERE is_default = TRUE
);

-- Indexes for performance
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_processor_token ON payment_methods(processor_token);

-- ============================================
-- 5. SUBSCRIPTION PLANS TABLE (Reference Data)
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10, 2) NOT NULL CHECK (price_monthly >= 0),
    price_annual NUMERIC(10, 2) NOT NULL CHECK (price_annual >= 0),
    currency TEXT DEFAULT 'NGN',
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}', -- { "max_listings": 15, "max_images_per_listing": 10 }
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_annual, features, limits, sort_order) VALUES
('free', 'Free Tier', 'Perfect for getting started', 0, 0, 
    '["List up to 3 items", "Basic chat support", "7-day listing duration", "Standard visibility"]',
    '{"max_listings": 3, "listing_duration_days": 7, "max_images_per_listing": 5}',
    1
),
('campus_starter', 'Campus Starter', 'Ideal for active student sellers', 2500, 27000,
    '["List up to 15 items", "Priority chat support", "30-day listing duration", "Enhanced visibility", "Basic analytics", "Verification badge"]',
    '{"max_listings": 15, "listing_duration_days": 30, "max_images_per_listing": 10, "priority_support": true}',
    2
),
('campus_pro', 'Campus Pro', 'For serious campus entrepreneurs', 5000, 54000,
    '["Unlimited listings", "24/7 priority support", "90-day listing duration", "Premium visibility", "Advanced analytics", "Featured merchant badge", "Custom business page", "Bulk upload tools"]',
    '{"max_listings": -1, "listing_duration_days": 90, "max_images_per_listing": 20, "priority_support": true, "featured_badge": true}',
    3
),
('enterprise', 'Enterprise', 'Custom solutions for organizations', 0, 0,
    '["All Campus Pro features", "Dedicated account manager", "API access", "White-label options", "Custom integrations"]',
    '{"max_listings": -1, "listing_duration_days": 365, "custom_features": true}',
    4
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. PROMO CODES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    currency TEXT DEFAULT 'NGN',
    applicable_plans TEXT[] DEFAULT '{}', -- Empty array means all plans
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CHECK (current_uses <= max_uses OR max_uses IS NULL)
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = TRUE;

-- ============================================
-- 7. SUBSCRIPTION USAGE TABLE (For Analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL, -- 'listings_created', 'images_uploaded', 'api_calls'
    metric_value INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX idx_subscription_usage_period ON subscription_usage(period_start, period_end);

-- ============================================
-- 8. WEBHOOK EVENTS TABLE (For Audit Trail)
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processor TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_id TEXT UNIQUE NOT NULL, -- Processor's event ID
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_processor ON webhook_events(processor);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- ============================================
-- 9. UPDATE USERS TABLE
-- ============================================

-- Add subscription-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'past_due', 'cancelled', 'trialing', 'pending_verification')),
ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);

CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- ============================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    month TEXT;
    sequence_num INTEGER;
BEGIN
    year := TO_CHAR(NOW(), 'YYYY');
    month := TO_CHAR(NOW(), 'MM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE 'MB-' || year || month || '-%';
    
    RETURN 'MB-' || year || month || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own data
CREATE POLICY subscriptions_user_policy ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY payments_user_policy ON payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY invoices_user_policy ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY payment_methods_user_policy ON payment_methods FOR ALL USING (auth.uid() = user_id);
CREATE POLICY subscription_usage_user_policy ON subscription_usage FOR ALL USING (auth.uid() = user_id);

-- Policies: Everyone can read subscription plans
CREATE POLICY subscription_plans_read_policy ON subscription_plans FOR SELECT USING (TRUE);

-- ============================================
-- 12. INITIAL DATA SETUP
-- ============================================

-- Create a default free subscription for existing users
INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
SELECT 
    id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '100 years' -- Free tier never expires
FROM users
WHERE role IN ('dealer', 'student_seller')
AND NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE subscriptions.user_id = users.id
)
ON CONFLICT DO NOTHING;

-- Update users table with subscription info
UPDATE users u
SET 
    subscription_status = 'free',
    subscription_plan_id = 'free',
    subscription_id = s.id
FROM subscriptions s
WHERE u.id = s.user_id
AND s.plan_id = 'free'
AND s.status = 'active'
AND u.subscription_id IS NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify migration
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('subscriptions', 'payments', 'invoices', 'payment_methods', 'subscription_plans', 'promo_codes', 'subscription_usage', 'webhook_events');
    
    IF table_count = 8 THEN
        RAISE NOTICE 'Migration successful! All 8 tables created.';
    ELSE
        RAISE EXCEPTION 'Migration incomplete. Expected 8 tables, found %', table_count;
    END IF;
END $$;
