import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key',
        {
            cookieOptions: {
                domain: typeof window !== 'undefined' && window.location.hostname.includes('marketbridge.com.ng')
                    ? '.marketbridge.com.ng'
                    : undefined,
                path: '/',
                sameSite: 'lax',
            }
        }
    )
}
