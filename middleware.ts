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
            // Return hard 404 — not a redirect that reveals the route exists
            return new NextResponse(null, { status: 404 });
        }

        // If env is true, also check DB flag for extra safety
        // (Supabase DB check happens server-side via API route, not here in edge middleware,
        //  to avoid cold-start latency. The /public page itself checks the DB flag on render.)
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/public/:path*'],
};
