import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'
    const role = searchParams.get('role')

    if (code) {
        console.log('Auth Callback: Code detected, initiating exchange...');
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Handled in middleware
                        }
                    },
                },
            }
        )
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.user) {
            console.log('Auth Callback: Exchange successful for:', data.user.email);

            let finalNext = next === '/' ? '/marketplace' : next;

            // Fetch existing profile if any
            const { data: existingUser } = await supabase.from('users').select('role, display_name, first_name, last_name').eq('id', data.user.id).maybeSingle();
            
            // Check if this is a social login (Google/Facebook)
            const isSocialLogin = data.user.app_metadata.provider !== 'email';

            // Core Logic: If user not found and no role provided (e.g. login page via Social)
            // Just auto-create them as a student_buyer to ensure seamless entry.
            if (!existingUser && !role && !isSocialLogin) {
                console.warn('Auth Callback: Manual signup attempt detected via callback. Redirecting to signup...');
                await supabase.auth.signOut();
                return NextResponse.redirect(new URL('/signup?error=Account+not+found.+Please+sign+up+to+continue.', origin));
            }

            const finalRole = role || existingUser?.role || 'student_buyer';

            console.log('Auth Callback: Upserting profile with role:', finalRole);
            await supabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                display_name: existingUser?.display_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
                first_name: existingUser?.first_name || data.user.user_metadata?.first_name || '',
                last_name: existingUser?.last_name || data.user.user_metadata?.last_name || '',
                role: finalRole,
                email_verified: true, // Social login implies verification
            }, { onConflict: 'id' });

            return NextResponse.redirect(new URL(finalNext, origin))
        } else {
            console.error('Auth Callback: Exchange failed:', error?.message);
        }
    }

    const errorMsg = searchParams.get('error_description') || 'Authentication handshake failed'
    console.warn('Auth Callback: Redirecting to login due to error:', errorMsg);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, origin))
}
