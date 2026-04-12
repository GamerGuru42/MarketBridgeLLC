import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'
    const roleParam = searchParams.get('role')

    if (code) {
        console.log('Auth Callback: Code detected, initiating exchange...');
        const cookieStore = cookies()
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            console.log('Auth Callback: Exchange successful for:', data.user.email);

            // Fetch existing profile if any
            const { data: existingUser } = await supabase.from('users').select('role, display_name').eq('id', data.user.id).maybeSingle();
            
            // Check if this is a social login (Google/Facebook)
            const isSocialLogin = data.user.app_metadata.provider !== 'email';

            const cookieRole = cookieStore.get('mb_oauth_role')?.value;
            const role = roleParam || cookieRole;
            const cookieNext = cookieStore.get('mb_oauth_next')?.value;
            const nextUrlParam = searchParams.get('next');
            let finalNext = nextUrlParam || (cookieNext ? decodeURIComponent(cookieNext) : '/');

            if (cookieRole) cookieStore.delete('mb_oauth_role');
            if (cookieNext) cookieStore.delete('mb_oauth_next');

            // Core Logic: If user not found and no role provided (e.g. login page via Social)
            // Just auto-create them as a student_buyer to ensure seamless entry.
            if (!existingUser && !role && !isSocialLogin) {
                console.warn('Auth Callback: Manual signup attempt detected via callback. Redirecting to signup...');
                await supabase.auth.signOut();
                return NextResponse.redirect(new URL('/signup?error=Account+not+found.+Please+sign+up+to+continue.', origin));
            }

            const finalRole = role || existingUser?.role || 'student_buyer';
            let actualRole = finalRole;
            let redirectPath = finalNext;

            // Enforce educational email requirement for sellers
            if (actualRole === 'student_seller' || actualRole === 'seller') {
                const userEmail = data.user.email?.toLowerCase() || '';
                const isEducational = userEmail.endsWith('.edu.ng') || userEmail.endsWith('.edu') || userEmail.endsWith('.com.ng');
                
                if (!isEducational) {
                    console.warn(`Auth Callback: Rejected seller login for non-educational email (${userEmail}). Downgrading to buyer.`);
                    actualRole = 'student_buyer';
                    redirectPath = '/marketplace?alert=invalid_school_email';
                }
            }

            console.log('Auth Callback: Upserting profile with role:', actualRole);
            await supabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                display_name: existingUser?.display_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
                role: actualRole,
                email_verified: true, // Social login implies verification
                ...(isSocialLogin && { is_verified: true }) // Fast-track full verification for Google Sign-In
            }, { onConflict: 'id' });

            // CRITICAL: Update the user's JWT metadata so Edge Middleware immediately recognizes the role
            await supabase.auth.updateUser({ data: { role: actualRole } });

            return NextResponse.redirect(new URL(redirectPath, origin))
        } else {
            console.error('Auth Callback: Exchange failed:', error?.message);
        }
    }

    const errorMsg = searchParams.get('error_description') || 'Authentication handshake failed'
    console.warn('Auth Callback: Redirecting to login due to error:', errorMsg);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, origin))
}
