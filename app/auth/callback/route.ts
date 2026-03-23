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

            // Fetch existing role if any
            const { data: existingUser } = await supabase.from('users').select('role').eq('id', data.user.id).single();
            const finalRole = role || existingUser?.role || 'buyer';

            console.log('Auth Callback: Upserting profile with role:', finalRole);
            await supabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
                role: finalRole,
                email_verified: true // Social login implies verification
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
