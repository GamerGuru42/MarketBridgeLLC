import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Department to allowed roles mapping
function getAllowedRolesForDepartment(dept: string): string[] {
    switch (dept) {
        case 'operations_admin': return ['operations_admin'];
        case 'marketing_admin': return ['marketing_admin'];
        case 'systems_admin': return ['systems_admin', 'technical_admin'];
        case 'it_support': return ['it_support'];
        case 'ceo': return ['ceo', 'cofounder', 'cto', 'coo'];
        default: return [];
    }
}

function getHubRoute(role: string): string {
    if (role === 'ceo' || role === 'cofounder') return '/admin/ceo';
    if (role === 'operations_admin') return '/admin/operations';
    if (role === 'marketing_admin') return '/admin/marketing';
    if (role === 'systems_admin' || role === 'technical_admin') return '/admin/systems';
    if (role === 'it_support') return '/admin/it-support';
    return '/admin';
}

async function logLoginAttempt(email: string, role: string | null, success: boolean, reason: string) {
    try {
        await supabaseAdmin.from('system_audit_logs').insert({
            action_type: success ? 'ADMIN_LOGIN_SUCCESS' : 'ADMIN_LOGIN_DENIED',
            details: { email, role, reason, timestamp: new Date().toISOString() },
        });
    } catch (e) {
        console.error('Audit log write failed:', e);
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const roleParam = searchParams.get('role')
    const deptParam = searchParams.get('dept')

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
            const dept = deptParam || cookieStore.get('mb_oauth_dept')?.value;
            const nextParam = searchParams.get('next');
            const cookieNext = cookieStore.get('mb_oauth_next')?.value;
            let finalNext = nextParam || (cookieNext ? decodeURIComponent(cookieNext) : '/');

            // Clean up one-time cookies
            try { if (cookieStore.get('mb_oauth_role')) cookieStore.delete('mb_oauth_role'); } catch {}
            try { if (cookieStore.get('mb_oauth_next')) cookieStore.delete('mb_oauth_next'); } catch {}
            try { if (cookieStore.get('mb_oauth_dept')) cookieStore.delete('mb_oauth_dept'); } catch {}

            // ── Fetch existing profile ──
            let { data: existingUser } = await supabase
                .from('users')
                .select('id, role, display_name')
                .eq('id', data.user.id)
                .maybeSingle();

            const isSocialLogin = data.user.app_metadata.provider !== 'email';
            const userEmail = data.user.email?.toLowerCase() || '';

            // Handle pre-registered admin accounts (created by CEO/Systems Admin via email)
            if (!existingUser && userEmail) {
                const { data: emailUser } = await supabaseAdmin
                    .from('users')
                    .select('id, role, display_name')
                    .eq('email', userEmail)
                    .maybeSingle();
                
                if (emailUser) {
                    existingUser = emailUser;
                    // Bridge the placeholder gap by updating the database to use their real Google Auth ID
                    await supabaseAdmin
                        .from('users')
                        .update({ id: data.user.id })
                        .eq('email', userEmail);
                }
            }

            // ── PORTAL (Admin) Login Path ──
            // If role or dept cookie is present, this is a portal login attempt
            const isPortalLogin = !!(role || dept);

            if (isPortalLogin) {
                // STRICT VALIDATION: Check if the user exists in our DB at all
                if (!existingUser) {
                    console.warn(`Auth Callback: No admin account found for ${userEmail}`);
                    await logLoginAttempt(userEmail, null, false, 'No account found in database');
                    await supabase.auth.signOut();
                    return NextResponse.redirect(
                        new URL(`/portal/login?error=${encodeURIComponent('No admin account found for this email. Please contact your system administrator.')}`, origin)
                    );
                }

                const dbRole = existingUser.role;

                // Check if user has ANY admin role
                if (!dbRole || !ADMIN_ROLES.includes(dbRole)) {
                    console.warn(`Auth Callback: ${userEmail} has role "${dbRole}" — not an admin`);
                    await logLoginAttempt(userEmail, dbRole, false, 'Account exists but is not an admin role');
                    await supabase.auth.signOut();
                    return NextResponse.redirect(
                        new URL(`/portal/login?error=${encodeURIComponent('Your account does not have administrative privileges. Please contact your system administrator.')}`, origin)
                    );
                }

                // Check if user's role matches the department they selected
                if (dept) {
                    const allowedRoles = getAllowedRolesForDepartment(dept);
                    // CEO/execs can access any department
                    const isExec = ['ceo', 'cofounder', 'cto', 'coo'].includes(dbRole);
                    if (!isExec && allowedRoles.length > 0 && !allowedRoles.includes(dbRole)) {
                        console.warn(`Auth Callback: ${userEmail} role "${dbRole}" does not match department "${dept}"`);
                        await logLoginAttempt(userEmail, dbRole, false, `Role mismatch: tried ${dept} but has ${dbRole}`);
                        await supabase.auth.signOut();
                        return NextResponse.redirect(
                            new URL(`/portal/login?error=${encodeURIComponent('Your account does not have access to this department. Please contact your system administrator.')}`, origin)
                        );
                    }
                }

                // ── AUTHORIZED: Use the DB role (not the cookie intent) for routing ──
                const actualRole = dbRole;
                finalNext = getHubRoute(actualRole);

                // Update JWT metadata to match DB
                await supabase.auth.updateUser({ data: { role: actualRole } });

                await logLoginAttempt(userEmail, actualRole, true, `Routed to ${finalNext}`);

                console.log('Auth Callback: Admin authorized. Redirecting to:', finalNext, '| Role:', actualRole);

                const redirectUrl = new URL(finalNext, origin);
                const response = NextResponse.redirect(redirectUrl);

                // Set admin session cookie
                const payload = Buffer.from(JSON.stringify({ uid: data.user.id, role: actualRole, ts: Date.now() })).toString('base64');
                const isProduction = origin.includes('marketbridge.com.ng');
                response.cookies.set('mb-admin-session', payload, {
                    path: '/',
                    maxAge: 8 * 60 * 60,
                    sameSite: 'lax',
                    secure: isProduction,
                    ...(isProduction && { domain: '.marketbridge.com.ng' }),
                });

                return response;
            }

            // ── PUBLIC (Buyer/Seller) Login Path ──
            let actualRole = 'buyer';

            if (existingUser?.role && ADMIN_ROLES.includes(existingUser.role)) {
                actualRole = existingUser.role;
            } else {
                actualRole = existingUser?.role || 'buyer';
            }
            
            // Standardize roles
            if (actualRole === 'student_seller' || actualRole === 'dealer') actualRole = 'seller';
            if (actualRole === 'student_buyer' || actualRole === 'customer') actualRole = 'buyer';

            // Enforce .edu.ng school email for ALL sellers
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
            const { error: upsertError } = await supabaseAdmin.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                display_name: existingUser?.display_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
                role: actualRole,
                email_verified: true,
                ...(isSocialLogin && { is_verified: true })
            }, { onConflict: 'id' });

            if (upsertError) {
                console.error('Auth Callback: Failed to upsert profile via Admin client:', upsertError);
            }

            // ── Update JWT metadata ──
            await supabase.auth.updateUser({ data: { role: actualRole } });

            // Build redirect URL
            let redirectUrl: URL;
            try {
                redirectUrl = new URL(finalNext);
            } catch {
                redirectUrl = new URL(finalNext, origin);
            }

            console.log('Auth Callback: Redirecting to:', redirectUrl.toString(), '| Role:', actualRole);
            return NextResponse.redirect(redirectUrl);
        } else {
            console.error('Auth Callback: Exchange failed:', error?.message);
        }
    }

    const errorMsg = searchParams.get('error_description') || 'Something went wrong during sign in. Please try again.'
    console.warn('Auth Callback: Redirecting to login due to error:', errorMsg);
    
    // If we're coming from the portal, redirect back to portal login
    const isPortalCallback = searchParams.get('role') || searchParams.get('dept') || cookies().get('mb_oauth_role');
    const redirectPath = isPortalCallback ? '/portal/login' : '/login';
    
    return NextResponse.redirect(new URL(`${redirectPath}?error=${encodeURIComponent(errorMsg)}`, origin))
}
