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
    const authError = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    const isProduction = host.endsWith('marketbridge.com.ng');
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    // Handle explicit errors from OAuth provider
    if (authError) {
        return NextResponse.redirect(new URL(`/login?error=${authError}&message=${encodeURIComponent(error_description || '')}`, request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
    }

    try {
        console.log(`Auth Callback Initiated. Code present: ${!!code}, Role Intent: ${roleIntent}, Next: ${nextPath}`);
            const supabase = await createClient();
            console.log('Exchanging code for session...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('exchangeCodeForSession error:', error);
                throw new Error(`Auth Error: ${error.message}`);
            }

            if (data?.user) {
                const userEmail = data.user.email?.toLowerCase() || '';
                const cookieStore = cookies();
                console.log(`Session established for user: ${userEmail} (${data.user.id})`);

                // ── 1. Fetch/Migrate User Profile ──
                let { data: profile, error: profileErr } = await supabaseAdmin
                    .from('users')
                    .select('id, role, email')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profileErr) {
                    console.error('Error fetching user profile from database:', profileErr);
                    // continue, profile will be provisioned
                }

                // Bridge pre-registered email accounts if ID doesn't match yet
                if (!profile && userEmail) {
                    const { data: emailMatch, error: emailMatchErr } = await supabaseAdmin
                        .from('users')
                        .select('id, role, email')
                        .eq('email', userEmail)
                        .maybeSingle();
                    
                    if (emailMatchErr) console.error('Error fetching pre-registered email data:', emailMatchErr);

                    if (emailMatch) {
                        console.log(`Bridging existing profile for ${userEmail} to new ID ${data.user.id}`);
                        const { error: bridgeErr } = await supabaseAdmin.from('users').update({ id: data.user.id }).eq('email', userEmail);
                        if (bridgeErr) console.error('Error bridging account:', bridgeErr);
                        profile = { ...emailMatch, id: data.user.id };
                    }
                }

                // Apply Role Migration Logic
                const rawRole = profile?.role || roleIntent || 'student_buyer';
                const finalRole = migrateRole(rawRole);
                console.log(`Calculated Final Role: ${finalRole}`);

                // Provision profile if missing
                if (!profile) {
                    console.log(`Provisioning new profile in users table for ${userEmail} with role ${finalRole}`);
                    const { error: insertErr } = await supabaseAdmin.from('users').upsert({
                        id: data.user.id,
                        email: userEmail,
                        role: finalRole,
                        display_name: data.user.user_metadata?.full_name || userEmail.split('@')[0],
                    });
                    if (insertErr) {
                        console.error('Failed to provision user profile:', insertErr);
                        throw new Error(`Profile creation failed: ${insertErr.message}`);
                    }
                } else if (profile.role !== finalRole) {
                    console.log(`Updating role for ${userEmail} from ${profile.role} to ${finalRole}`);
                    const { error: updateErr } = await supabaseAdmin.from('users').update({ role: finalRole }).eq('id', data.user.id);
                    if (updateErr) {
                        console.error('Failed to update user profile role:', updateErr);
                        throw new Error(`Role update failed: ${updateErr.message}`);
                    }
                }

                // Sync JWT metadata
                console.log(`Updating auth metadata with role: ${finalRole}`);
                const { error: jwtErr } = await supabase.auth.updateUser({ data: { role: finalRole } });
                if (jwtErr) {
                    console.error('Failed to update auth metadata:', jwtErr);
                }

                // ── 2. Handle Portal (Admin) Flow ──
                if (typePostAuth === 'portal') {
                    console.log(`Portal Request - User Role: ${finalRole}`);
                    // SECURITY CHECK: Ensure user HAS an admin role to access portal
                    if (!ADMIN_ROLES.includes(finalRole)) {
                        console.log('Access Denied: Insufficient privileges for portal.');
                        await logAudit(userEmail, 'PORTAL_ACCESS_DENIED', { role: finalRole, reason: 'Insufficient privileges' });
                        await supabase.auth.signOut();
                        const loginUrl = new URL('/portal/login', request.url);
                        if (isProduction) loginUrl.hostname = 'hq.marketbridge.com.ng';
                        loginUrl.searchParams.set('error', 'Your account does not have administrative access.');
                        return NextResponse.redirect(loginUrl);
                    }

                    // SUCCESS: Redirect to HQ Portal
                    console.log('Portal Access Granted');
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
                // SPECIAL: Enforce .edu.ng for Sellers
                console.log(`Checking domain validation for role ${finalRole}: ${userEmail}`);
                if (finalRole === 'student_seller' && !userEmail.endsWith('.edu.ng')) {
                    console.log(`Domain validation failed for seller intent: ${userEmail}. Signing out.`);
                    await supabase.auth.signOut();
                    
                    // Route back to origin of signup attempt so they see the error
                    const errorUrl = new URL(roleIntent === 'student_seller' ? '/seller-onboard' : '/signup', request.url);
                    if (isProduction) errorUrl.hostname = 'marketbridge.com.ng';
                    errorUrl.searchParams.set('error', 'Sellers must use their university school email ending in .edu.ng. Please sign in with your school email.');
                    return NextResponse.redirect(errorUrl);
                }

                const redirectUrl = new URL(nextPath, request.url);
                if (isProduction) redirectUrl.hostname = 'marketbridge.com.ng';

                // Check if user has completed profile
                const { data: profileCheck } = await supabaseAdmin
                    .from('users')
                    .select('university, matricNumber')
                    .eq('id', data.user.id)
                    .single();

                if (!profileCheck?.university || !profileCheck?.matricNumber) {
                    const completeProfileUrl = new URL(`/complete-profile?email=${encodeURIComponent(userEmail)}&role=${finalRole}`, request.url);
                    if (isProduction) completeProfileUrl.hostname = 'marketbridge.com.ng';
                    return NextResponse.redirect(completeProfileUrl);
                }

                // Redirect based on role
                if (finalRole === 'student_buyer') {
                    redirectUrl.pathname = '/dashboard';
                } else if (finalRole === 'student_seller') {
                    redirectUrl.pathname = '/seller-dashboard';
                } else if (ADMIN_ROLES.includes(finalRole)) {
                    if (isProduction) {
                        redirectUrl.hostname = 'hq.marketbridge.com.ng';
                    }
                    redirectUrl.pathname = getHubRoute(finalRole);
                }

                console.log(`Auth Callback Result: Routing ${userEmail} to ${redirectUrl.toString()}`);
                return NextResponse.redirect(redirectUrl);
            } else {
                 console.log(`No user returned in exchangeCodeForSession result.`);
                 throw new Error('User data missing after code exchange.');
            }
    } catch (err: any) {
        console.error('Critical Error in Auth Callback:', err);
        const errorUrl = new URL('/signup', request.url);
        if (isProduction) errorUrl.hostname = 'marketbridge.com.ng';
        errorUrl.searchParams.set('error', `Authentication failed: ${err.message || 'Unknown server error'}. Please try again.`);
        return NextResponse.redirect(errorUrl);
    }
}
