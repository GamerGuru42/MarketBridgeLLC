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
        'dealer': 'seller',
        'campus_starter': 'seller',
        'campus_pro': 'seller',
        'elite': 'seller',
        'buyer': 'buyer',
        'seller': 'seller',
        'customer': 'buyer',
        'student_buyer': 'buyer',
        'student_seller': 'seller',
    };
    // Admin roles are kept as is for manual review per CEO instructions
    if (oldRole && ADMIN_ROLES.includes(oldRole)) return oldRole;
    return mapping[oldRole || ''] || 'buyer';
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
                // We prioritize roleIntent if provided (e.g. from /signup selection)
                const rawRole = roleIntent || profile?.role || 'buyer';
                const finalRole = migrateRole(rawRole);
                console.log(`Calculated Final Role: ${finalRole} (Intent: ${roleIntent}, Profile: ${profile?.role})`);

                // Provision profile if missing
                if (!profile) {
                    console.log(`Provisioning new profile in users table for ${userEmail} with role ${finalRole}`);
                    
                    const isSellerDomain = userEmail.endsWith('.edu.ng') || userEmail.endsWith('miva.university');
                    const dbRole = isSellerDomain ? 'seller' : 'buyer';
                    const isNewBuyer = dbRole === 'buyer';

                    // Auto-detect university for sellers
                    let university = null;
                    if (dbRole === 'seller') {
                        const domain = userEmail.split('@')[1];
                        const universityMap: Record<string, string> = {
                            'nileuniversity.edu.ng': 'Nile University of Nigeria',
                            'bazeuniversity.edu.ng': 'Baze University',
                            'veritas.edu.ng': 'Veritas University',
                            'aust.edu.ng': 'African University of Science & Technology',
                            'eun.edu.ng': 'European University of Nigeria',
                            'philomath.edu.ng': 'Philomath University',
                            'cosmopolitan.edu.ng': 'Cosmopolitan University',
                            'miva.university': 'Miva Open University',
                            'primeuniversity.edu.ng': 'Prime University Abuja',
                            'binghamuni.edu.ng': 'Bingham University',
                        };
                        university = universityMap[domain] || 'Unknown';
                    }

                    const userData = {
                        id: data.user.id,
                        email: userEmail,
                        role: dbRole,
                        display_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || userEmail.split('@')[0],
                        university: university,
                        is_verified: true,
                        email_verified: true,
                        photo_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
                        onboarding_complete: isNewBuyer,
                        payout_setup: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    console.log('INSERTING USER WITH ROLE:', dbRole);
                    console.log('INSERTING USER WITH DATA:', JSON.stringify(userData));

                    const { error: insertErr } = await supabaseAdmin.from('users').upsert(userData);

                    if (insertErr) {
                        console.error('Failed to provision user profile:', insertErr);
                        // Redirect to signup with detailed error for debugging as requested
                        const errorUrl = new URL('/signup', request.url);
                        errorUrl.searchParams.set('error', `Profile creation failed: ${insertErr.message}`);
                        return NextResponse.redirect(errorUrl);
                    }
                } else if (profile.role !== finalRole) {
                    console.log(`Updating role for ${userEmail} from ${profile.role} to ${finalRole}`);
                    // Map to DB-compatible role
                    const dbRole = finalRole === 'student_seller' ? 'seller' : 
                                  finalRole === 'student_buyer' ? 'buyer' : finalRole;
                    const { error: updateErr } = await supabaseAdmin.from('users').update({ role: dbRole }).eq('id', data.user.id);
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
                // SPECIAL: Enforce Whitelist for Sellers
                if (finalRole === 'student_seller') {
                    const universityMap: Record<string, string> = {
                        'nileuniversity.edu.ng': 'Nile University of Nigeria',
                        'bazeuniversity.edu.ng': 'Baze University',
                        'veritas.edu.ng': 'Veritas University',
                        'aust.edu.ng': 'African University of Science & Technology',
                        'eun.edu.ng': 'European University of Nigeria',
                        'philomath.edu.ng': 'Philomath University',
                        'cosmopolitan.edu.ng': 'Cosmopolitan University',
                        'miva.university': 'Miva Open University',
                        'primeuniversity.edu.ng': 'Prime University Abuja',
                        'binghamuni.edu.ng': 'Bingham University',
                    };
                    
                    const domain = userEmail.split('@')[1];
                    const universityName = universityMap[domain];
                    
                    if (!userEmail.endsWith('.edu.ng') && !userEmail.endsWith('miva.university')) {
                         console.log(`Domain validation failed for seller intent: ${userEmail}. Signing out.`);
                         await supabase.auth.signOut();
                         const errorUrl = new URL('/signup', request.url);
                         errorUrl.searchParams.set('seller_error', 'invalid_domain');
                         errorUrl.searchParams.set('email', userEmail);
                         return NextResponse.redirect(errorUrl);
                    }

                    if (!universityName) {
                        console.log(`Unapproved university for seller intent: ${userEmail}. Signing out.`);
                        await supabase.auth.signOut();
                        const errorUrl = new URL('/signup', request.url);
                        errorUrl.searchParams.set('seller_error', 'unapproved_university');
                        errorUrl.searchParams.set('email', userEmail);
                        return NextResponse.redirect(errorUrl);
                    }
                }

                const redirectUrl = new URL(nextPath, request.url);
                if (isProduction) redirectUrl.hostname = 'marketbridge.com.ng';

                // Check if user has completed profile (Section 4.1 Step 3.6)
                const { data: profileCheck } = await supabaseAdmin
                    .from('users')
                    .select('onboarding_complete, university')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (finalRole === 'seller' && !profileCheck?.onboarding_complete) {
                    const completeProfileUrl = new URL(`/seller-onboarding`, request.url);
                    if (isProduction) completeProfileUrl.hostname = 'marketbridge.com.ng';
                    return NextResponse.redirect(completeProfileUrl);
                }

                // Redirect based on role
                if (finalRole === 'buyer') {
                    redirectUrl.pathname = '/buyer-dashboard';
                } else if (finalRole === 'seller') {
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
