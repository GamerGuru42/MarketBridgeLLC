import { createClient } from '@/lib/supabase/server';

export type AuditCategory = 'admin' | 'moderation' | 'financial' | 'system' | 'auth' | 'user';
export type AuditSeverity = 'info' | 'warning' | 'critical';

interface AuditLogEntry {
    /** The action performed, e.g. 'approve_seller', 'revoke_seller', 'update_settings' */
    action: string;
    /** Category of the action */
    category?: AuditCategory;
    /** Severity level */
    severity?: AuditSeverity;
    /** Type of the target resource, e.g. 'user', 'listing', 'order' */
    targetType?: string;
    /** ID of the target resource */
    targetId?: string;
    /** Human-readable label for the target */
    targetLabel?: string;
    /** Arbitrary metadata about the action */
    details?: Record<string, unknown>;
    /** State before the change */
    oldValue?: Record<string, unknown> | null;
    /** State after the change */
    newValue?: Record<string, unknown> | null;
}

/**
 * Logs an admin/system action to the audit_logs table.
 * Call this from any API route after performing a state-changing operation.
 * 
 * @param entry - The audit log entry details
 * @param request - Optional Request object to extract IP and User-Agent
 */
export async function logAudit(entry: AuditLogEntry, request?: Request): Promise<void> {
    try {
        const supabase = await createClient();

        // Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser();

        // Extract request metadata
        let ipAddress: string | null = null;
        let userAgent: string | null = null;

        if (request) {
            ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                || request.headers.get('x-real-ip')
                || null;
            userAgent = request.headers.get('user-agent') || null;
        }

        let actorRole: string | null = null;
        if (user) {
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();
            actorRole = userData?.role || null;
        }

        const { error } = await supabase.from('audit_logs').insert({
            actor_id: user?.id || null,
            actor_email: user?.email || null,
            actor_role: actorRole,
            action: entry.action,
            category: entry.category || 'admin',
            severity: entry.severity || 'info',
            target_type: entry.targetType || null,
            target_id: entry.targetId || null,
            target_label: entry.targetLabel || null,
            details: entry.details || {},
            old_value: entry.oldValue || null,
            new_value: entry.newValue || null,
            ip_address: ipAddress,
            user_agent: userAgent,
        });

        if (error) {
            // Never throw from audit logging — it should never break the main operation
            console.error('[AuditLog] Failed to insert:', error.message);
        }
    } catch (err) {
        // Silently fail — audit logging must never crash the parent operation
        console.error('[AuditLog] Unexpected error:', err);
    }
}
