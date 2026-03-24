import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    // Intercept misplaced OAuth codes that Supabase sends to the root URL
    if (pathname === '/' && searchParams.has('code')) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/callback';
        return NextResponse.redirect(url);
    }

    // Block all /public/* routes when public section is disabled
    const disablePublic = process.env.NEXT_PUBLIC_DISABLE_PUBLIC_SECTION === 'true';
    if (disablePublic && pathname.startsWith('/public')) {
        return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/public/:path*', '/'],
};
