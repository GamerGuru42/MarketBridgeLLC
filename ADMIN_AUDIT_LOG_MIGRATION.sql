-- ADMIN AUDIT LOG TABLE
-- Tracks all login attempts to the internal admin portal for security review.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('login_success', 'login_failure', 'access_denied', 'session_created', 'session_expired')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by user and time
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.admin_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_event ON public.admin_audit_log(event_type, created_at DESC);

-- RLS: Only service_role and the admin's own records are readable
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can insert their own audit entries
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only service_role can read audit logs (for admin dashboard queries via server-side)
DROP POLICY IF EXISTS "Service role can read audit logs" ON public.admin_audit_log;
CREATE POLICY "Service role can read audit logs"
ON public.admin_audit_log
FOR SELECT
TO service_role
USING (true);

-- Admins can read their own logs
DROP POLICY IF EXISTS "Admins can read own audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can read own audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

GRANT ALL ON public.admin_audit_log TO service_role;
GRANT INSERT, SELECT ON public.admin_audit_log TO authenticated;
