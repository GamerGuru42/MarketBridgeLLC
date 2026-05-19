-- ============================================
-- MARKETBRIDGE: AUDIT LOGGING SYSTEM
-- Track every admin action with timestamps,
-- actor identity, and before/after state.
-- ============================================

-- 1. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Who performed the action
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT,
    -- What action was performed
    action TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'admin'
        CHECK (category IN ('admin', 'moderation', 'financial', 'system', 'auth', 'user')),
    severity TEXT NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info', 'warning', 'critical')),
    -- What was affected
    target_type TEXT,        -- e.g. 'user', 'listing', 'order', 'escrow', 'setting'
    target_id TEXT,          -- ID of the affected resource
    target_label TEXT,       -- Human-readable label (e.g. user email, listing title)
    -- Change details
    details JSONB DEFAULT '{}'::jsonb,   -- Arbitrary metadata
    old_value JSONB DEFAULT NULL,        -- State before change
    new_value JSONB DEFAULT NULL,        -- State after change
    -- Context
    ip_address TEXT,
    user_agent TEXT,
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('warning', 'critical');

-- 2. ROW LEVEL SECURITY
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit logs (identified via service role or admin check)
-- Regular users cannot see audit logs at all
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin', 'ceo')
        )
    );

-- Insert is allowed for any authenticated user (API routes insert on behalf of admin)
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Nobody can update or delete audit logs (immutable)
-- No UPDATE or DELETE policies = implicit deny
