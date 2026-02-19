import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── PUBLIC SECTION KILL-SWITCH ──
    // Both the env var AND DB flag must be true to allow access.
    // Default: locked (ENABLE_PUBLIC_SECTION must be explicitly "true")
    if (pathname.startsWith('/public')) {
        const envEnabled = process.env.ENABLE_PUBLIC_SECTION === 'true';

        if (!envEnabled) {
            return new NextResponse(null, { status: 404 });
        }

        // DB Check for extra safety (hard-lock)
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

            // Simple fetch to avoid heavy client initialization if possible
            const res = await fetch(
                `${supabaseUrl}/rest/v1/site_settings?key=eq.public_section_enabled&select=value`,
                {
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`
                    }
                }
            );

            const data = await res.json();
            const dbEnabled = data?.[0]?.value === 'true' || data?.[0]?.value === true;

            if (!dbEnabled) {
                return new NextResponse(null, { status: 404 });
            }
        } catch (e) {
            // If DB check fails, default to locked for safety
            console.error('Middleware DB check failed:', e);
            return new NextResponse(null, { status: 404 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/public/:path*'],
};
