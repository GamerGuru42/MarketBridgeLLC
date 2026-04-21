import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ─── Role Mapping & Constants ───────────────────────────────────────────────
const ADMIN_ROLES = ['ceo', 'operations_admin', 'marketing_admin', 'systems_admin', 'it_support', 'technical_admin', 'admin'];

function getHubRoute(role: string): string {
    if (role === 'ceo') return '/admin/ceo';
    if (role === 'operations_admin') return '/admin/operations';
    if (role === 'marketing_admin') return '/admin/marketing';
    if (role === 'systems_admin') return '/admin/systems';
    if (role === 'it_support') return '/admin/it-support';
    return '/admin';
}

function migrateRole(oldRole: string | null): string {
    if (!oldRole) return 'student_buyer';
    const mapping: Record<string, string> = {
        'dealer': 'student_seller',
        'campus_starter': 'student_seller',
        'campus_pro': 'student_seller',
        'elite': 'student_seller',
        'buyer': 'student_buyer',
        'customer': 'student_buyer',
        'student_buyer': 'student_buyer',
        'student_seller': 'student_seller',
    };
    // Admin roles are kept as is for manual review per CEO instructions
    if (ADMIN_ROLES.includes(oldRole)) return oldRole;
    return mapping[oldRole] || 'student_buyer';
}

async function logAudit(email: string, action: string, details: any) {
    try {
        await supabaseAdmin.from('system_audit_logs').insert({
            action_type: action,
            details: { ...details, timestamp: new Date().toISOString(), email }
        });
    } catch (e) {
        console.error('Audit log failed:', e);
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const host = request.headers.get('host') || '';
    const code = searchParams.get('code')
    const typePostAuth = searchParams.get('type') // 'portal' or null
    const roleIntent = searchParams.get('role')
    const nextPath = searchParams.get('next') || '/'

    const isProduction = host.endsWith('marketbridge.com.ng');
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            const userEmail = data.user.email?.toLowerCase() || '';
            const cookieStore = cookies();

            // ── 1. Fetch/Migrate User Profile ──
            let { data: profile } = await supabaseAdmin
                .from('users')
                .select('id, role, email')
                .eq('id', data.user.id)
                .maybeSingle();

            // Bridge pre-registered email accounts if ID doesn't match yet
            if (!profile && userEmail) {
                const { data: emailMatch } = await supabaseAdmin
                    .from('users')
                    .select('id, role, email')
                    .eq('email', userEmail)
                    .maybeSingle();
                
                if (emailMatch) {
                    await supabaseAdmin.from('users').update({ id: data.user.id }).eq('email', userEmail);
                    profile = { ...emailMatch, id: data.user.id };
                }
            }

            // Apply Role Migration Logic
            const rawRole = profile?.role || roleIntent || 'student_buyer';
            const finalRole = migrateRole(rawRole);

            // Provision profile if missing
            if (!profile) {
                await supabaseAdmin.from('users').upsert({
                    id: data.user.id,
                    email: userEmail,
                    role: finalRole,
                    display_name: data.user.user_metadata?.full_name || userEmail.split('@')[0],
                });
            } else if (profile.role !== finalRole) {
                // Update legacy role to standardized role
                await supabaseAdmin.from('users').update({ role: finalRole }).eq('id', data.user.id);
            }

            // Sync JWT metadata
            await supabase.auth.updateUser({ data: { role: finalRole } });

            // ── 2. Handle Portal (Admin) Flow ──
            if (typePostAuth === 'portal') {
                // SECURITY CHECK: Ensure user HAS an admin role to access portal
                if (!ADMIN_ROLES.includes(finalRole)) {
                    await logAudit(userEmail, 'PORTAL_ACCESS_DENIED', { role: finalRole, reason: 'Insufficient privileges' });
                    await supabase.auth.signOut();
                    const loginUrl = new URL('/portal/login', request.url);
                    if (isProduction) loginUrl.hostname = 'hq.marketbridge.com.ng';
                    loginUrl.searchParams.set('error', 'Your account does not have administrative access.');
                    return NextResponse.redirect(loginUrl);
                }

                // SUCCESS: Redirect to HQ Portal
                await logAudit(userEmail, 'PORTAL_LOGIN_SUCCESS', { role: finalRole });
                const dest = getHubRoute(finalRole);
                const redirectUrl = new URL(dest, request.url);
                if (isProduction) redirectUrl.hostname = 'hq.marketbridge.com.ng';

                const response = NextResponse.redirect(redirectUrl);
                
                // Set Portal-Specific Session Cookie (Strictly Scoped)
                const payload = btoa(JSON.stringify({ uid: data.user.id, role: finalRole, ts: Date.now() }));
                response.cookies.set('mb-admin-session', payload, {
                    path: '/',
                    maxAge: 8 * 60 * 60,
                    sameSite: 'lax',
                    secure: true,
                    // NO wildcard domain - strictly this subdomain
                });

                return response;
            }

            // ── 3. Handle Public Marketplace Flow ──
            // SECURITY CHECK: If user is admin trying to login via public site, still route to marketplace
            // but ensure they don't land on hq.*
            
            // SPECIAL: Enforce .edu.ng for Sellers
            if (finalRole === 'student_seller' && !userEmail.endsWith('.edu.ng')) {
                await supabase.auth.signOut();
                const errorUrl = new URL('/login', request.url);
                if (isProduction) errorUrl.hostname = 'marketbridge.com.ng';
                errorUrl.searchParams.set('error', 'Sellers must use their university school email ending in .edu.ng. Please sign in with your school email.');
                return NextResponse.redirect(errorUrl);
            }

            const redirectUrl = new URL(nextPath, request.url);
            if (isProduction) redirectUrl.hostname = 'marketbridge.com.ng';

            console.log(`Auth Callback: Routing ${userEmail} to ${redirectUrl.toString()}`);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // Error recovery
    const errorMsg = searchParams.get('error_description') || 'Authentication failed.';
    const isPortalFail = searchParams.get('type') === 'portal';
    const fallbackUrl = new URL(isPortalFail ? '/portal/login' : '/login', request.url);
    if (isProduction) fallbackUrl.hostname = isPortalFail ? 'hq.marketbridge.com.ng' : 'marketbridge.com.ng';
    fallbackUrl.searchParams.set('error', errorMsg);
    
    return NextResponse.redirect(fallbackUrl);
}
