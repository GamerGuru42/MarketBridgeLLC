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
            const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo', 'systems_admin', 'it_support'];
            const role = roleParam || cookieStore.get('mb_oauth_role')?.value;
            const nextParam = searchParams.get('next');
            const cookieNext = cookieStore.get('mb_oauth_next')?.value;
            let finalNext = nextParam || (cookieNext ? decodeURIComponent(cookieNext) : '/');

            // Clean up one-time cookies
            try { if (cookieStore.get('mb_oauth_role')) cookieStore.delete('mb_oauth_role'); } catch {}
            try { if (cookieStore.get('mb_oauth_next')) cookieStore.delete('mb_oauth_next'); } catch {}

            // ── Fetch existing profile ──
            const { data: existingUser } = await supabase
                .from('users')
                .select('role, display_name')
                .eq('id', data.user.id)
                .maybeSingle();

            const isSocialLogin = data.user.app_metadata.provider !== 'email';

            // ── Resolve Final Role ──
            // Logic Priority:
            // 1. Explicit role from cookie/param (Highest intent - used for Portal logins)
            // 2. Existing database role (if it's already an admin)
            // 3. Default to 'buyer'
            
            let actualRole = 'buyer';
            const userEmail = data.user.email?.toLowerCase() || '';

            // ── Resolve Role with Intent & Database Priority ──
            // If they chose a specific role in the portal, we HONOUR it (e.g. CEO testing Ops flow)
            if (role && ADMIN_ROLES.includes(role)) {
                actualRole = role.trim(); 
            } else if (existingUser?.role && ADMIN_ROLES.includes(existingUser.role)) {
                actualRole = existingUser.role; // Sustained if no explicit intent provided
            } else {
                actualRole = existingUser?.role || 'buyer';
            }
            
            // Standardize roles
            if (actualRole === 'student_seller' || actualRole === 'dealer') actualRole = 'seller';
            if (actualRole === 'student_buyer' || actualRole === 'customer') actualRole = 'buyer';

            // Enforce .edu.ng school email for ALL sellers — reject personal emails
            if (actualRole === 'seller') {
                if (!userEmail.endsWith('.edu.ng')) {
                    console.warn(`Auth Callback: Non-.edu.ng email "${userEmail}" attempted seller login/signup. Blocking.`);
                    await supabase.auth.signOut();
                    return NextResponse.redirect(
                        new URL('/login?error=' + encodeURIComponent('Sellers must use a school email ending in .edu.ng. Please use your university Google account.'), origin)
                    );
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

            // ── Update JWT metadata ──
            await supabase.auth.updateUser({ data: { role: actualRole } });

            const isAdminUser = ADMIN_ROLES.includes(actualRole);

            // ── Strict Admin Redirection ──
            // If the user is an admin, ignore 'next' and force dashboard
            if (isAdminUser) {
                if (actualRole === 'ceo') {
                    finalNext = '/admin/ceo';
                } else {
                    finalNext = '/admin';
                }
            }

            // ── Build redirect URL ──
            let redirectUrl: URL;
            try {
                redirectUrl = new URL(finalNext);
            } catch {
                redirectUrl = new URL(finalNext, origin);
            }

            console.log('Auth Callback: Redirecting to:', redirectUrl.toString(), '| Role:', actualRole, '| Admin:', isAdminUser);

            const response = NextResponse.redirect(redirectUrl);

            // ── Ensure Admin Session Cookie is set in the response ──
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

    const errorMsg = searchParams.get('error_description') || 'Something went wrong during sign in. Please try again.'
    console.warn('Auth Callback: Redirecting to login due to error:', errorMsg);
    
    // If we're coming from the portal, redirect back to portal login
    const isPortalCallback = request.url.includes('role=') || cookies().get('mb_oauth_role');
    const redirectPath = isPortalCallback ? '/portal/login' : '/login';
    
    return NextResponse.redirect(new URL(`${redirectPath}?error=${encodeURIComponent(errorMsg)}`, origin))
}
