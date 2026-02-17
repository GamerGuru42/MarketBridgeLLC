import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

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
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('Auth Callback: Exchange successful. Redirecting to:', next);
            return NextResponse.redirect(new URL(next, origin))
        } else {
            console.error('Auth Callback: Exchange failed:', error.message);
        }
    }

    const errorMsg = searchParams.get('error_description') || 'Authentication handshake failed'
    console.warn('Auth Callback: Redirecting to login due to error:', errorMsg);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, origin))
}
