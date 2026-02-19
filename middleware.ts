import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. PUBLIC SECTION KILL-SWITCH
    // Check environment variable (Redline override)
    const envEnabled = process.env.ENABLE_PUBLIC_SECTION === 'true';

    // If env is true, we skip the DB check for speed (Manual Overlord override)
    let isPublicSectionEnabled = envEnabled;

    if (!isPublicSectionEnabled && pathname.startsWith('/public')) {
        // Check Database setting as fallback
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'public_section_enabled')
                .single();

            if (data && data.value === true) {
                isPublicSectionEnabled = true;
            }
        } catch (e) {
            console.error('Middleware Security Handshake Failed:', e);
        }
    }

    // If trying to access /public and it's disabled, redirect to home
    if (pathname.startsWith('/public') && !isPublicSectionEnabled) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/public/:path*',
    ],
};
