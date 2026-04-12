import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const roleParam = searchParams.get('role')

    if (code) {
        console.log('Auth Callback: Code detected, initiating exchange...');
        const cookieStore = cookies()
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            console.log('Auth Callback: Exchange successful for:', data.user.email);

            // ── Resolve role & destination from query params OR fallback cookies ──
            const cookieRole = cookieStore.get('mb_oauth_role')?.value;
            const cookieNext = cookieStore.get('mb_oauth_next')?.value;

            const role = roleParam || cookieRole;
            const nextParam = searchParams.get('next');
            let finalNext = nextParam || (cookieNext ? decodeURIComponent(cookieNext) : '/');

            // Clean up one-time cookies
            if (cookieRole) try { cookieStore.delete('mb_oauth_role'); } catch {}
            if (cookieNext) try { cookieStore.delete('mb_oauth_next'); } catch {}

            // ── Fetch existing profile ──
            const { data: existingUser } = await supabase
                .from('users')
                .select('role, display_name')
                .eq('id', data.user.id)
                .maybeSingle();

            const isSocialLogin = data.user.app_metadata.provider !== 'email';

            // If not found and no role provided and not social → block
            if (!existingUser && !role && !isSocialLogin) {
                console.warn('Auth Callback: Manual signup attempt. Redirecting to signup...');
                await supabase.auth.signOut();
                return NextResponse.redirect(new URL('/signup?error=Account+not+found.+Please+sign+up+to+continue.', origin));
            }

            const finalRole = role || existingUser?.role || 'student_buyer';
            let actualRole = finalRole;
            let redirectPath = finalNext;

            // Enforce educational email for sellers
            if (actualRole === 'student_seller' || actualRole === 'seller') {
                const userEmail = data.user.email?.toLowerCase() || '';
                const isEducational = userEmail.endsWith('.edu.ng') || userEmail.endsWith('.edu') || userEmail.endsWith('.com.ng');
                if (!isEducational) {
                    console.warn(`Auth Callback: Non-educational email for seller. Downgrading.`);
                    actualRole = 'student_buyer';
                    redirectPath = '/marketplace?alert=invalid_school_email';
                }
            }

            // ── Upsert profile ──
            console.log('Auth Callback: Upserting profile with role:', actualRole);
            await supabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                display_name: existingUser?.display_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
                role: actualRole,
                email_verified: true,
                ...(isSocialLogin && { is_verified: true })
            }, { onConflict: 'id' });

            // ── Update JWT metadata so future middleware checks see the role ──
            // NOTE: This updates metadata for NEXT session refresh, not the current JWT.
            await supabase.auth.updateUser({ data: { role: actualRole } });

            // ── For admin roles, set the mb-admin-session cookie server-side ──
            // This is critical: the portal login page sets this cookie client-side,
            // but during Google OAuth flow, users never return to the portal login page.
            // The middleware requires this cookie to grant admin access.
            const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'];
            const isAdminUser = ADMIN_ROLES.includes(actualRole);

            // ── Build redirect URL ──
            let redirectUrl: URL;
            try {
                // If redirectPath is already a full URL (e.g. https://hq.marketbridge.com.ng/admin/ceo)
                redirectUrl = new URL(redirectPath);
            } catch {
                // It's a relative path
                redirectUrl = new URL(redirectPath, origin);
            }

            console.log('Auth Callback: Redirecting to:', redirectUrl.toString(), '| Role:', actualRole, '| Admin:', isAdminUser);

            const response = NextResponse.redirect(redirectUrl);

            if (isAdminUser) {
                const payload = Buffer.from(JSON.stringify({ uid: data.user.id, role: actualRole, ts: Date.now() })).toString('base64');
                const isProduction = origin.includes('marketbridge.com.ng');

                response.cookies.set('mb-admin-session', payload, {
                    path: '/',
                    maxAge: 8 * 60 * 60, // 8 hours
                    sameSite: 'lax',
                    secure: isProduction,
                    ...(isProduction && { domain: '.marketbridge.com.ng' }),
                });
            }

            return response;
        } else {
            console.error('Auth Callback: Exchange failed:', error?.message);
        }
    }

    const errorMsg = searchParams.get('error_description') || 'Authentication handshake failed'
    console.warn('Auth Callback: Redirecting to login due to error:', errorMsg);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, origin))
}
