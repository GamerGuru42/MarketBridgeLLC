import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Rate Limiting ───────────────────────────────────────────────────────────
// Lightweight Edge Rate Limiter (per-isolate, sufficient for brute force protection)
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();

interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
}

const PUBLIC_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,       // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
};

const ADMIN_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,       // 15 minutes
    blockDurationMs: 60 * 60 * 1000, // 60 minutes — harsher for admin
};

function checkRateLimit(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const tracker = rateLimitMap.get(key);

    if (!tracker) {
        rateLimitMap.set(key, { count: 1, firstAttempt: now });
        return true;
    }

    if (tracker.count >= config.maxAttempts) {
        if (now - tracker.firstAttempt < config.blockDurationMs) {
            return false;
        } else {
            rateLimitMap.set(key, { count: 1, firstAttempt: now });
            return true;
        }
    }

    if (now - tracker.firstAttempt < config.windowMs) {
        tracker.count += 1;
        rateLimitMap.set(key, tracker);
        if (tracker.count >= config.maxAttempts) {
            tracker.firstAttempt = now;
            return false;
        }
        return true;
    } else {
        rateLimitMap.set(key, { count: 1, firstAttempt: now });
        return true;
    }
}

// ─── JWT Helpers ─────────────────────────────────────────────────────────────
// Decode (but don't verify signature — Edge can't do full HMAC easily).
// We verify *existence* + *role claim*. Supabase server-side checks do full verification.
function decodeJwtPayload(token: string): Record<string, any> | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function extractRoleFromCookies(request: NextRequest): string | null {
    const cookies = request.cookies.getAll();
    
    // Find the Supabase auth token cookie
    const authCookie = cookies.find(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
    if (!authCookie) return null;

    // Supabase stores tokens as base64-encoded JSON array [access_token, refresh_token]
    // or as a plain JWT depending on the version
    try {
        let accessToken: string | null = null;

        // Try parsing as JSON array first (newer SSR format)
        try {
            const parsed = JSON.parse(decodeURIComponent(authCookie.value));
            if (Array.isArray(parsed) && parsed.length > 0) {
                accessToken = parsed[0];
            } else if (parsed?.access_token) {
                accessToken = parsed.access_token;
            }
        } catch {
            // Maybe it's a raw JWT
            if (authCookie.value.includes('.')) {
                accessToken = authCookie.value;
            }
        }

        if (!accessToken) return null;

        const payload = decodeJwtPayload(accessToken);
        if (!payload) return null;

        // Check expiry
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;

        return payload.user_metadata?.role || payload.role || null;
    } catch {
        return null;
    }
}

const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder'];

// ─── Middleware ──────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown-ip';

    // ── 0. Subdomain & Host Detection ────────────────────────────────────────
    const host = request.headers.get('host') || '';
    const isHQSubdomain = host.startsWith('hq.');

    // ── 1. Rate Limiting ────────────────────────────────────────────────────
    const isPortalRoute = pathname.startsWith('/portal') || pathname.startsWith('/admin');
    const isAuthRoute = pathname.includes('/login') || pathname.includes('/auth') || pathname.includes('/signup');

    if (isAuthRoute) {
        const config = isPortalRoute ? ADMIN_RATE_LIMIT : PUBLIC_RATE_LIMIT;
        const rateLimitKey = isPortalRoute ? `admin:${ip}` : `public:${ip}`;
        const isAllowed = checkRateLimit(rateLimitKey, config);

        if (!isAllowed) {
            const blockMinutes = isPortalRoute ? 60 : 30;
            return new NextResponse(
                JSON.stringify({ error: `Too many attempts. Access blocked for ${blockMinutes} minutes.` }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }

    // ── 2. Intercept misplaced OAuth codes ───────────────────────────────────
    if (pathname === '/' && searchParams.has('code')) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/callback';
        return NextResponse.redirect(url);
    }

    // ── 3. Block /public/* when disabled ─────────────────────────────────────
    const disablePublic = process.env.NEXT_PUBLIC_DISABLE_PUBLIC_SECTION === 'true';
    if (disablePublic && pathname.startsWith('/public')) {
        return new NextResponse('Not Found', { status: 404 });
    }

    // ── 3.5. Subdomain Flow Control ──────────────────────────────────────────
    // If on HQ subdomain, rewrite root to portal login
    if (isHQSubdomain && (pathname === '/' || pathname === '/login')) {
        const url = request.nextUrl.clone();
        url.pathname = '/portal/login';
        return NextResponse.rewrite(url);
    }

    // If NOT on HQ subdomain, heavily block direct access to internal routes
    // DISABLED FOR PRIVATE BETA: Allow access via /portal/login directly on main domain
    // if (!isHQSubdomain && isPortalRoute) {
    //     return new NextResponse('Not Found', { status: 404 });
    // }

    // ── 4. Internal System Isolation (Admin + Portal) ────────────────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {
        const cookies = request.cookies.getAll();
        const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));
        const hasAdminSession = request.cookies.has('mb-admin-session');

        // Allow unauthenticated access ONLY to portal login/signup
        if (pathname === '/portal/login' || pathname === '/portal/signup') {
            const response = NextResponse.next();
            response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
            return response;
        }

        // No auth cookie at all → redirect to portal login
        if (!hasAuthCookie) {
            const url = request.nextUrl.clone();
            url.pathname = '/portal/login';
            return NextResponse.redirect(url);
        }

        // Has auth cookie → verify role in JWT
        const role = extractRoleFromCookies(request);

        if (!role || !ADMIN_ROLES.includes(role)) {
            // User is authenticated but NOT an admin — hard block
            return new NextResponse(
                JSON.stringify({ error: 'Access denied. Insufficient privileges.' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Has valid admin role but no admin session cookie → redirect to portal login
        // (They need to authenticate through the portal specifically)
        if (!hasAdminSession) {
            const url = request.nextUrl.clone();
            url.pathname = '/portal/login';
            url.searchParams.set('reason', 'session_required');
            return NextResponse.redirect(url);
        }

        // ✅ Fully authenticated admin — allow through with security headers
        const response = NextResponse.next();
        response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        return response;
    }

    // ── 5. Universal Security Headers ────────────────────────────────────────
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
