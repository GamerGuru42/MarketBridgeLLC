import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; firstAttempt: number }>();

interface RateLimitConfig {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
}

const PUBLIC_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000,
};

const ADMIN_RATE_LIMIT: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
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

    // Find the Supabase auth token cookie (could be chunked or single)
    // @supabase/ssr can split large cookies into chunks: sb-<ref>-auth-token.0, .1, etc.
    const authCookieName = cookies.find(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))?.name;
    if (!authCookieName) return null;

    // Reconstruct the full cookie value from potential chunks
    const baseName = authCookieName.replace(/\.\d+$/, ''); // strip chunk suffix like .0
    const chunks: string[] = [];
    
    // Check for chunked cookies first
    for (let i = 0; i < 10; i++) {
        const chunk = request.cookies.get(`${baseName}.${i}`);
        if (chunk) {
            chunks.push(chunk.value);
        } else {
            break;
        }
    }

    // If no chunks found, try the base cookie directly
    let rawValue: string;
    if (chunks.length > 0) {
        rawValue = chunks.join('');
    } else {
        const singleCookie = request.cookies.get(baseName);
        if (!singleCookie) return null;
        rawValue = singleCookie.value;
    }

    try {
        let accessToken: string | null = null;

        // Try parsing as JSON first (newer SSR format: base64 encoded JSON)
        try {
            const decoded = decodeURIComponent(rawValue);
            const parsed = JSON.parse(decoded);
            if (Array.isArray(parsed) && parsed.length > 0) {
                accessToken = parsed[0];
            } else if (typeof parsed === 'object' && parsed?.access_token) {
                accessToken = parsed.access_token;
            }
        } catch {
            // Try as base64-encoded value
            try {
                const decoded = atob(rawValue);
                const parsed = JSON.parse(decoded);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    accessToken = parsed[0];
                } else if (parsed?.access_token) {
                    accessToken = parsed.access_token;
                }
            } catch {
                // Maybe it's a raw JWT
                if (rawValue.includes('.') && rawValue.split('.').length === 3) {
                    accessToken = rawValue;
                }
            }
        }

        if (!accessToken) return null;

        const payload = decodeJwtPayload(accessToken);
        if (!payload) return null;

        // Check expiry
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;

        // Role can be in multiple places depending on how it was set:
        // 1. user_metadata.role (set via updateUser)
        // 2. app_metadata.role (set via admin API) 
        // 3. payload.role (custom claim)
        return payload.user_metadata?.role 
            || payload.app_metadata?.role 
            || payload.role 
            || null;
    } catch {
        return null;
    }
}

const ADMIN_ROLES = ['admin', 'technical_admin', 'operations_admin', 'marketing_admin', 'ceo', 'cofounder', 'cto', 'coo'];

const ROLE_PATH_ACCESS: Record<string, string[]> = {
    '/admin/ceo': ['ceo', 'cofounder'],
    '/admin/technical': ['technical_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/operations': ['operations_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/marketing': ['marketing_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/users': ['operations_admin', 'technical_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/listings': ['marketing_admin', 'operations_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/orders': ['operations_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/payouts': ['operations_admin', 'ceo', 'cofounder', 'admin'],
    '/admin/revenue': ['ceo', 'cofounder', 'admin'],
    '/admin/disputes': ['operations_admin', 'ceo', 'cofounder', 'admin'],
};

// ─── Middleware ──────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown-ip';

    // ── 0. Subdomain & Host Detection ────────────────────────────────────────
    const host = request.headers.get('host') || '';
    const isHQSubdomain = host.startsWith('hq.') || host.includes('.hq.');

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
                JSON.stringify({ error: `Too many attempts. Your access is temporarily restricted for ${blockMinutes} minutes for security.` }),
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
    if (isHQSubdomain && (pathname === '/' || pathname === '/login')) {
        const url = request.nextUrl.clone();
        url.pathname = '/portal/login';
        return NextResponse.rewrite(url);
    }

    // ── 4. Internal System Isolation (Admin + Portal) ────────────────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/portal')) {

        // Allow unauthenticated access ONLY to portal login/signup
        if (pathname === '/portal/login' || pathname === '/portal/signup') {
            const response = NextResponse.next();
            response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
            return response;
        }

        // Check for Supabase auth cookie
        const cookies = request.cookies.getAll();
        const hasAuthCookie = cookies.some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
        const hasAdminSession = request.cookies.has('mb-admin-session');

        // No auth cookie at all → redirect to portal login
        if (!hasAuthCookie) {
            const url = request.nextUrl.clone();
            url.pathname = '/portal/login';
            return NextResponse.redirect(url);
        }

        // Has auth cookie → verify role in JWT
        const role = extractRoleFromCookies(request);

        if (!role || !ADMIN_ROLES.includes(role)) {
            // Check mb-admin-session as fallback
            let backupRole: string | null = null;
            if (hasAdminSession) {
                try {
                    const adminPayload = request.cookies.get('mb-admin-session')?.value;
                    if (adminPayload) {
                        const decoded = JSON.parse(atob(adminPayload));
                        if (decoded.role && ADMIN_ROLES.includes(decoded.role)) {
                            backupRole = decoded.role;
                        }
                    }
                } catch {}
            }

            if (!backupRole) {
                return new NextResponse(
                    JSON.stringify({ error: 'Access denied. You do not have administrative privileges.' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        const effectiveRole = role || extractRoleFromCookies(request); // double check or use backup

        // ── ROLE-BASED PATH FILTERING ────────────────────────────────────────
        // Check if the user has permission for the specific sub-path
        const activeRole = role || (hasAdminSession ? JSON.parse(atob(request.cookies.get('mb-admin-session')?.value || '{}')).role : null);
        
        for (const [path, allowedRoles] of Object.entries(ROLE_PATH_ACCESS)) {
            if (pathname.startsWith(path) && !allowedRoles.includes(activeRole)) {
                return new NextResponse(
                    JSON.stringify({ error: 'Security Alert: Access to this department is restricted for your role.' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        const response = NextResponse.next();
        response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        
        // Add Security Headers
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;");
        
        return response;
    }

    // ── 4.5. Launch Shield (Global guest protection) ──────────────────────────
    const IS_LOGGED_IN = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
    const LAUNCH_PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth', '/portal', '/seller-qr', '/seller-onboard', '/verify-email', '/reset-password', '/api'];

    const isPublicRoute = LAUNCH_PUBLIC_ROUTES.some(route => 
        pathname === route || pathname.startsWith(route + '/')
    ) || (isHQSubdomain && (pathname === '/' || pathname === '/login' || pathname.startsWith('/portal')));

    if (!IS_LOGGED_IN && !isPublicRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // ── 5. Administrative Isolation (Force redirects for Executive accounts) ──
    const userRoleForIsolation = extractRoleFromCookies(request);
    if (userRoleForIsolation && ADMIN_ROLES.includes(userRoleForIsolation)) {
        if (pathname.startsWith('/seller') || pathname.startsWith('/buyer')) {
            const portalUrl = request.nextUrl.clone();
            portalUrl.pathname = userRoleForIsolation === 'ceo' ? '/admin/ceo' : '/admin';
            return NextResponse.redirect(portalUrl);
        }
    }

    // ── 6. Universal Security Headers (Public Routes) ──
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
